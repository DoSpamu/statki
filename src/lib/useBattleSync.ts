import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import type { GameSession } from '../types/lobby';
import type { BoardGrid, CellState, PlacedShip } from '../types/board';
import { SHIP_DEFINITIONS } from '../types/board';

const TOTAL_SHIP_CELLS = SHIP_DEFINITIONS.reduce((s, d) => s + d.size * d.count, 0);

function createEmptyGrid(): BoardGrid {
  return Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 10 }, (_, col) => ({ row, col, state: 'empty' as CellState })),
  );
}

function applyCell(grid: BoardGrid, row: number, col: number, state: CellState): BoardGrid {
  return grid.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? { ...c, state } : c)),
  );
}

function buildOccupiedSet(ships: PlacedShip[]): Set<string> {
  const set = new Set<string>();
  for (const ship of ships)
    for (const [r, c] of ship.cells) set.add(`${r},${c}`);
  return set;
}

interface ShotRow {
  shooter_id: string;
  target_row: number;
  target_col: number;
  is_hit: boolean;
}

export function useBattleSync(
  session: GameSession,
  applyIncomingShot: (row: number, col: number) => void,
) {
  const [opponentGrid, setOpponentGrid] = useState<BoardGrid>(createEmptyGrid);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [myHits, setMyHits] = useState(0);
  const [theirHits, setTheirHits] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  const [sunkOpponentCells, setSunkOpponentCells] = useState<Set<string>>(new Set());
  const [sunkNotification, setSunkNotification] = useState<string | null>(null);
  const [myShotCount, setMyShotCount] = useState(0);

  // Refy — unikają stale closure w callbackach Realtime
  const applyIncomingShotRef = useRef(applyIncomingShot);
  applyIncomingShotRef.current = applyIncomingShot;
  const opponentOccupiedRef = useRef<Set<string>>(new Set());
  const pendingShotsRef = useRef<Set<string>>(new Set());

  // Dane statków przeciwnika — do wykrywania zatopień
  const opponentShipsRef = useRef<PlacedShip[]>([]);
  const sunkShipIndicesRef = useRef<Set<number>>(new Set());
  const sunkOpponentCellsRef = useRef<Set<string>>(new Set());
  const sunkNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Czas bitwy
  const battleStartTimeRef = useRef(Date.now());
  const winnerNotifiedRef = useRef(false);

  const isMyTurn =
    (session.playerSlot === 'player1' && currentTurn === 'player1') ||
    (session.playerSlot === 'player2' && currentTurn === 'player2');

  const winner: 'me' | 'opponent' | null =
    myHits >= TOTAL_SHIP_CELLS ? 'me' :
    theirHits >= TOTAL_SHIP_CELLS ? 'opponent' : null;

  // Wykrywanie zatopionych statków przeciwnika po każdej zmianie planszy
  useEffect(() => {
    if (opponentShipsRef.current.length === 0) return;
    let hasNew = false;

    opponentShipsRef.current.forEach((ship, idx) => {
      if (sunkShipIndicesRef.current.has(idx)) return;
      const allHit = ship.cells.every(([r, c]) => opponentGrid[r][c].state === 'hit');
      if (!allHit) return;

      sunkShipIndicesRef.current.add(idx);
      ship.cells.forEach(([r, c]) => sunkOpponentCellsRef.current.add(`${r},${c}`));
      hasNew = true;

      const def = SHIP_DEFINITIONS.find(d => d.type === ship.type);
      setSunkNotification(`Zatopiłeś! ${def?.name ?? ship.type}`);
      if (sunkNotifTimerRef.current) clearTimeout(sunkNotifTimerRef.current);
      sunkNotifTimerRef.current = setTimeout(() => setSunkNotification(null), 3000);
    });

    if (hasNew) setSunkOpponentCells(new Set(sunkOpponentCellsRef.current));
  }, [opponentGrid]);

  // Aktualizacja DB gdy wygrałem
  useEffect(() => {
    if (winner !== 'me' || winnerNotifiedRef.current) return;
    winnerNotifiedRef.current = true;
    supabase
      .from('games')
      .update({ status: 'finished', winner_id: session.playerId, finished_at: new Date().toISOString() })
      .eq('id', session.gameId);
  }, [winner, session.gameId, session.playerId]);

  useEffect(() => {
    async function initialize() {
      // 1. Aktualny stan gry (tura, status)
      const { data: game } = await supabase
        .from('games')
        .select('current_turn')
        .eq('id', session.gameId)
        .single();
      if (game?.current_turn)
        setCurrentTurn(game.current_turn as 'player1' | 'player2');

      // 2. Statki przeciwnika (potrzebne do rozstrzygania trafień i zatopień)
      const { data: boards } = await supabase
        .from('boards')
        .select('player_id, ships')
        .eq('game_id', session.gameId);
      const oppBoard = boards?.find(b => b.player_id !== session.playerId);
      if (oppBoard?.ships) {
        const ships = oppBoard.ships as PlacedShip[];
        opponentOccupiedRef.current = buildOccupiedSet(ships);
        opponentShipsRef.current = ships;
      }

      // 3. Historia strzałów (obsługa reconnect)
      const { data: shots } = await supabase
        .from('shots')
        .select('shooter_id, target_row, target_col, is_hit')
        .eq('game_id', session.gameId)
        .order('created_at', { ascending: true });

      if (shots) {
        let grid = createEmptyGrid();
        let myHitCount = 0;
        let theirHitCount = 0;
        let myShots = 0;
        for (const shot of shots as ShotRow[]) {
          if (shot.shooter_id === session.playerId) {
            grid = applyCell(grid, shot.target_row, shot.target_col, shot.is_hit ? 'hit' : 'miss');
            if (shot.is_hit) myHitCount++;
            myShots++;
          } else {
            applyIncomingShotRef.current(shot.target_row, shot.target_col);
            if (shot.is_hit) theirHitCount++;
          }
        }
        setOpponentGrid(grid);
        setMyHits(myHitCount);
        setTheirHits(theirHitCount);
        setMyShotCount(myShots);
      }
    }

    initialize();

    // Realtime: nowe strzały
    const shotsCh = supabase
      .channel(`battle_shots:${session.gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shots', filter: `game_id=eq.${session.gameId}` },
        payload => {
          const shot = payload.new as ShotRow;
          if (shot.shooter_id === session.playerId) {
            const key = `${shot.target_row},${shot.target_col}`;
            if (pendingShotsRef.current.has(key)) {
              // Już zastosowano optymistycznie — tylko usuń z kolejki oczekujących
              pendingShotsRef.current.delete(key);
              return;
            }
            // Fallback (np. po reconnect — strzał z historii)
            setOpponentGrid(prev =>
              applyCell(prev, shot.target_row, shot.target_col, shot.is_hit ? 'hit' : 'miss'),
            );
            if (shot.is_hit) setMyHits(c => c + 1);
          } else {
            // Strzał przeciwnika na moją planszę
            applyIncomingShotRef.current(shot.target_row, shot.target_col);
            if (shot.is_hit) setTheirHits(c => c + 1);
          }
        },
      )
      .subscribe();

    // Realtime: zmiana tury
    const gameCh = supabase
      .channel(`battle_turn:${session.gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${session.gameId}` },
        payload => {
          const g = payload.new as { current_turn?: string };
          if (g.current_turn)
            setCurrentTurn(g.current_turn as 'player1' | 'player2');
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shotsCh);
      supabase.removeChannel(gameCh);
    };
  }, [session.gameId, session.playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireAtOpponent = useCallback(async (row: number, col: number) => {
    const isHit = opponentOccupiedRef.current.has(`${row},${col}`);

    // Optymistyczna aktualizacja — natychmiastowa odpowiedź wizualna przed potwierdzeniem DB
    setOpponentGrid(prev => applyCell(prev, row, col, isHit ? 'hit' : 'miss'));
    if (isHit) setMyHits(c => c + 1);
    pendingShotsRef.current.add(`${row},${col}`);

    setIsFiring(true);
    try {
      const { error } = await supabase.from('shots').insert({
        game_id: session.gameId,
        shooter_id: session.playerId,
        target_row: row,
        target_col: col,
        is_hit: isHit,
      });
      if (error) throw error;

      setMyShotCount(c => c + 1);

      // Trafienie: gracz strzela jeszcze raz (tura NIE zmienia się)
      // Pudło: tura przechodzi na przeciwnika
      if (!isHit) {
        const nextTurn = session.playerSlot === 'player1' ? 'player2' : 'player1';
        await supabase
          .from('games')
          .update({ current_turn: nextTurn })
          .eq('id', session.gameId);
      }
    } catch (e) {
      console.error('Błąd strzału:', e);
      // Cofnij optymistyczną aktualizację przy błędzie
      setOpponentGrid(prev => applyCell(prev, row, col, 'empty'));
      if (isHit) setMyHits(c => c - 1);
      pendingShotsRef.current.delete(`${row},${col}`);
    } finally {
      setIsFiring(false);
    }
  }, [session.gameId, session.playerId, session.playerSlot]);

  return {
    opponentGrid, currentTurn, isMyTurn, winner, isFiring, fireAtOpponent,
    sunkOpponentCells, sunkNotification,
    myShotCount, battleStartTime: battleStartTimeRef.current,
    myHits, theirHits,
  };
}
