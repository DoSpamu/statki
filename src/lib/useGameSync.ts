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

  // Ref zapobiega stale closure w callbacku Realtime
  const onBattleStartRef = useRef(onBattleStart);
  onBattleStartRef.current = onBattleStart;

  useEffect(() => {
    // Sprawdź aktualny status gry przy montowaniu (obsługa reconnect)
    supabase
      .from('games')
      .select('status')
      .eq('id', session.gameId)
      .single()
      .then(({ data }) => {
        if (data?.status === 'battle') onBattleStartRef.current();
      });

    // Sprawdź czy przeciwnik już zapisał swoją planszę
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

    // Subskrypcja zmian statusu gry → start walki
    const gamesCh = supabase
      .channel(`game_status:${session.gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${session.gameId}` },
        payload => {
          const updated = payload.new as { status: string };
          if (updated.status === 'battle') onBattleStartRef.current();
        },
      )
      .subscribe();

    // Subskrypcja planszy — wykrywa gotowość przeciwnika
    const boardsCh = supabase
      .channel(`boards_ready:${session.gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boards', filter: `game_id=eq.${session.gameId}` },
        payload => {
          const board = payload.new as { player_id: string; is_ready: boolean };
          if (board.player_id !== session.playerId && board.is_ready) {
            setState(s => ({ ...s, opponentReady: true }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesCh);
      supabase.removeChannel(boardsCh);
    };
  }, [session.gameId, session.playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gracz potwierdza gotowość — zapisuje planszę i sprawdza czy można zacząć
  const submitReady = useCallback(async (ships: PlacedShip[]) => {
    setState(s => ({ ...s, isSubmitting: true, error: null }));

    try {
      // Zapisz planszę (upsert — bezpieczne przy ponownym potwierdzeniu)
      const { error: boardError } = await supabase
        .from('boards')
        .upsert(
          { game_id: session.gameId, player_id: session.playerId, ships, is_ready: true },
          { onConflict: 'game_id,player_id' },
        );
      if (boardError) throw boardError;

      setState(s => ({ ...s, iAmReady: true, isSubmitting: false }));

      // Sprawdź czy obaj gracze są już gotowi → jeśli tak, startuj walkę
      const { data: boards } = await supabase
        .from('boards')
        .select('is_ready')
        .eq('game_id', session.gameId);

      if (boards && boards.length === 2 && boards.every(b => b.is_ready)) {
        // Aktualizacja statusu — wyzwoli Realtime u obu graczy
        const { error: gameError } = await supabase
          .from('games')
          .update({ status: 'battle', current_turn: 'player1' })
          .eq('id', session.gameId);
        if (gameError) throw gameError;
      }
    } catch (e) {
      setState(s => ({ ...s, isSubmitting: false, error: (e as Error).message }));
    }
  }, [session.gameId, session.playerId]);

  return { ...state, submitReady };
}
