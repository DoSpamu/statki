import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import type { GameSession } from '../types/lobby';
import type { PlacedShip } from '../types/board';

interface SyncState {
  iAmReady: boolean;
  opponentReady: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export function useGameSync(session: GameSession, onBattleStart: () => void) {
  const [state, setState] = useState<SyncState>({
    iAmReady: false,
    opponentReady: false,
    isSubmitting: false,
    error: null,
  });

  const onBattleStartRef = useRef(onBattleStart);
  onBattleStartRef.current = onBattleStart;

  // Idempotentne przejście do walki — nie wywołuj ponownie jeśli już przeszło
  const battleStartedRef = useRef(false);
  const triggerBattleStart = useCallback(() => {
    if (battleStartedRef.current) return;
    battleStartedRef.current = true;
    onBattleStartRef.current();
  }, []);

  // Pomocnicza: odpytaj DB o status gry i uruchom walkę jeśli gotowa
  const checkAndTrigger = useCallback(async () => {
    if (battleStartedRef.current) return;
    const { data } = await supabase
      .from('games')
      .select('status')
      .eq('id', session.gameId)
      .single();
    if (data?.status === 'battle') triggerBattleStart();
  }, [session.gameId, triggerBattleStart]);

  useEffect(() => {
    // Sprawdź stan przy montowaniu (reconnect / odświeżenie strony)
    checkAndTrigger();

    // Sprawdź czy któryś gracz już zapisał swoją planszę
    supabase
      .from('boards')
      .select('player_id, is_ready')
      .eq('game_id', session.gameId)
      .then(({ data }) => {
        if (!data) return;
        const myBoard  = data.find(b => b.player_id === session.playerId);
        const oppBoard = data.find(b => b.player_id !== session.playerId);
        if (myBoard?.is_ready)  setState(s => ({ ...s, iAmReady: true }));
        if (oppBoard?.is_ready) setState(s => ({ ...s, opponentReady: true }));
      });

    // Realtime: zmiana statusu gry → start walki
    const gamesCh = supabase
      .channel(`game_status:${session.gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${session.gameId}` },
        payload => {
          const updated = payload.new as { status: string };
          if (updated.status === 'battle') triggerBattleStart();
        },
      )
      .subscribe();

    // Realtime: gotowość planszy przeciwnika
    const boardsCh = supabase
      .channel(`boards_ready:${session.gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boards', filter: `game_id=eq.${session.gameId}` },
        payload => {
          const board = payload.new as { player_id: string; is_ready: boolean };
          if (board.player_id !== session.playerId && board.is_ready) {
            setState(s => ({ ...s, opponentReady: true }));
            // Gdy przeciwnik gotowy → sprawdź od razu czy gra już ruszyła
            checkAndTrigger();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesCh);
      supabase.removeChannel(boardsCh);
    };
  }, [session.gameId, session.playerId, checkAndTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling zapasowy — działa gdy Realtime nie dostarczy zdarzenia
  useEffect(() => {
    if (!state.iAmReady) return;
    const id = setInterval(checkAndTrigger, 2500);
    return () => clearInterval(id);
  }, [state.iAmReady, checkAndTrigger]);

  // Gracz klika GOTOWY — zapisuje planszę i uruchamia walkę gdy obaj gotowi
  const submitReady = useCallback(async (ships: PlacedShip[]) => {
    setState(s => ({ ...s, isSubmitting: true, error: null }));

    try {
      const { error: boardError } = await supabase
        .from('boards')
        .upsert(
          { game_id: session.gameId, player_id: session.playerId, ships, is_ready: true },
          { onConflict: 'game_id,player_id' },
        );
      if (boardError) throw boardError;

      setState(s => ({ ...s, iAmReady: true, isSubmitting: false }));

      // Sprawdź czy obaj gotowi
      const { data: boards } = await supabase
        .from('boards')
        .select('is_ready')
        .eq('game_id', session.gameId);

      if (boards && boards.length === 2 && boards.every(b => b.is_ready)) {
        const { error: gameError } = await supabase
          .from('games')
          .update({ status: 'battle', current_turn: 'player1' })
          .eq('id', session.gameId);
        if (gameError) throw gameError;

        // Nie czekaj na Realtime — przejdź do walki od razu po aktualizacji DB
        triggerBattleStart();
      }
    } catch (e) {
      setState(s => ({ ...s, isSubmitting: false, error: (e as Error).message }));
    }
  }, [session.gameId, session.playerId, triggerBattleStart]);

  return { ...state, submitReady };
}
