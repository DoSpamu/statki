import { useState, useEffect, useRef, useCallback } from 'react';
import type { BoardGrid, CellState, PlacedShip } from '../types/board';
import { SHIP_DEFINITIONS } from '../types/board';
import { randomPlaceShips, aiPickShot, adjacentCells } from './aiEngine';

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
  for (const ship of ships) for (const [r, c] of ship.cells) set.add(`${r},${c}`);
  return set;
}

export function useAIBattle(
  myPlacedShips: PlacedShip[],
  applyIncomingShot: (row: number, col: number) => void,
) {
  const [opponentGrid, setOpponentGrid] = useState<BoardGrid>(createEmptyGrid);
  const [isMyTurn, setIsMyTurn] = useState(true); // gracz zaczyna
  const [myHits, setMyHits] = useState(0);
  const [theirHits, setTheirHits] = useState(0);
  const [sunkOpponentCells, setSunkOpponentCells] = useState<Set<string>>(new Set());
  const [sunkNotification, setSunkNotification] = useState<string | null>(null);
  const [myShotCount, setMyShotCount] = useState(0);

  // Statki AI — tworzone raz przy montowaniu
  const aiShipsRef = useRef<PlacedShip[]>(randomPlaceShips());
  const aiOccupiedRef = useRef<Set<string>>(buildOccupiedSet(aiShipsRef.current));
  const myOccupiedRef = useRef<Set<string>>(buildOccupiedSet(myPlacedShips));

  // Stan AI — historia strzałów i kolejka celowania
  const aiShotHistoryRef = useRef<Set<string>>(new Set());
  const aiHitQueueRef = useRef<[number, number][]>([]);

  // Liczniki synchroniczne (bezpieczne w callbackach bez stale closure)
  const myHitsCountRef = useRef(0);
  const theirHitsCountRef = useRef(0);
  const gameOverRef = useRef(false);

  // Wykrywanie zatopionych statków AI
  const opponentSunkIndicesRef = useRef<Set<number>>(new Set());
  const opponentSunkCellsRef = useRef<Set<string>>(new Set());
  const sunkNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const battleStartTimeRef = useRef(Date.now());
  const applyIncomingShotRef = useRef(applyIncomingShot);
  applyIncomingShotRef.current = applyIncomingShot;

  const winner: 'me' | 'opponent' | null =
    myHits >= TOTAL_SHIP_CELLS ? 'me' :
    theirHits >= TOTAL_SHIP_CELLS ? 'opponent' : null;

  // Wykrywaj zatopione statki AI po każdej zmianie planszy przeciwnika
  useEffect(() => {
    let hasNew = false;
    aiShipsRef.current.forEach((ship, idx) => {
      if (opponentSunkIndicesRef.current.has(idx)) return;
      const allHit = ship.cells.every(([r, c]) => opponentGrid[r][c].state === 'hit');
      if (!allHit) return;

      opponentSunkIndicesRef.current.add(idx);
      ship.cells.forEach(([r, c]) => opponentSunkCellsRef.current.add(`${r},${c}`));
      hasNew = true;

      const def = SHIP_DEFINITIONS.find(d => d.type === ship.type);
      setSunkNotification(`Zatopiłeś! ${def?.name ?? ship.type}`);
      if (sunkNotifTimerRef.current) clearTimeout(sunkNotifTimerRef.current);
      sunkNotifTimerRef.current = setTimeout(() => setSunkNotification(null), 3000);
    });
    if (hasNew) setSunkOpponentCells(new Set(opponentSunkCellsRef.current));
  }, [opponentGrid]);

  // Tura AI — losowy wybór pola z uwzględnieniem trafień
  const scheduleAITurn = useCallback(() => {
    const delay = 600 + Math.random() * 500; // 600–1100 ms — symulacja "myślenia"
    setTimeout(() => {
      if (gameOverRef.current) return;

      const [row, col] = aiPickShot(aiShotHistoryRef.current, aiHitQueueRef.current);
      aiShotHistoryRef.current.add(`${row},${col}`);

      const isHit = myOccupiedRef.current.has(`${row},${col}`);
      applyIncomingShotRef.current(row, col);

      if (isHit) {
        theirHitsCountRef.current++;
        setTheirHits(theirHitsCountRef.current);
        if (theirHitsCountRef.current >= TOTAL_SHIP_CELLS) {
          gameOverRef.current = true;
          return;
        }
        // Dodaj sąsiadów do kolejki celowania
        adjacentCells(row, col).forEach(cell => aiHitQueueRef.current.push(cell));
        // AI strzela ponownie po trafieniu
        scheduleAITurn();
      } else {
        setIsMyTurn(true);
      }
    }, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Strzał gracza na planszę AI
  const fireAtOpponent = useCallback((row: number, col: number) => {
    if (!isMyTurn || gameOverRef.current) return;

    const isHit = aiOccupiedRef.current.has(`${row},${col}`);
    setOpponentGrid(prev => applyCell(prev, row, col, isHit ? 'hit' : 'miss'));
    setMyShotCount(c => c + 1);

    if (isHit) {
      myHitsCountRef.current++;
      setMyHits(myHitsCountRef.current);
      if (myHitsCountRef.current >= TOTAL_SHIP_CELLS) {
        gameOverRef.current = true;
      }
      // Trafienie — gracz strzela jeszcze raz (tura nie zmienia się)
    } else {
      // Pudło — tura AI
      setIsMyTurn(false);
      scheduleAITurn();
    }
  }, [isMyTurn, scheduleAITurn]);

  return {
    opponentGrid,
    isMyTurn,
    winner,
    isFiring: false as const,
    fireAtOpponent,
    sunkOpponentCells,
    sunkNotification,
    myShotCount,
    battleStartTime: battleStartTimeRef.current,
    myHits,
    theirHits,
  };
}
