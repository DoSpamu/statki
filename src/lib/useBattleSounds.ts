import { useEffect, useRef } from 'react';
import type { BoardGrid } from '../types/board';
import { playHit, playMiss, playIncomingHit, playSunk } from './soundEngine';

// Wykrywa zmiany na obu planszach i odtwarza odpowiednie dźwięki
export function useBattleSounds(
  opponentGrid: BoardGrid,     // moje strzały na wroga
  myGrid: BoardGrid,           // strzały wroga na mnie
  sunkOpponentCells: Set<string>,
) {
  const prevOpponentGridRef = useRef<BoardGrid | null>(null);
  const prevMyGridRef       = useRef<BoardGrid | null>(null);
  const prevSunkSizeRef     = useRef(0);

  // Strzały na planszę przeciwnika — hit lub miss
  useEffect(() => {
    if (!prevOpponentGridRef.current) {
      prevOpponentGridRef.current = opponentGrid;
      return;
    }
    const prev = prevOpponentGridRef.current;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const was = prev[r][c].state;
        const now = opponentGrid[r][c].state;
        if (was !== now) {
          if (now === 'hit')  playHit();
          if (now === 'miss') playMiss();
        }
      }
    }
    prevOpponentGridRef.current = opponentGrid;
  }, [opponentGrid]);

  // Strzały przeciwnika na moją planszę — oddzielny dźwięk (nieco cichszy)
  useEffect(() => {
    if (!prevMyGridRef.current) {
      prevMyGridRef.current = myGrid;
      return;
    }
    const prev = prevMyGridRef.current;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const was = prev[r][c].state;
        const now = myGrid[r][c].state;
        if (was !== now && (now === 'hit' || now === 'miss')) {
          playIncomingHit();
        }
      }
    }
    prevMyGridRef.current = myGrid;
  }, [myGrid]);

  // Zatopiony statek — potężniejszy dźwięk
  useEffect(() => {
    if (sunkOpponentCells.size > prevSunkSizeRef.current) {
      // Opóźnienie — żeby nie nakładać się z dźwiękiem trafienia (playHit)
      setTimeout(playSunk, 200);
    }
    prevSunkSizeRef.current = sunkOpponentCells.size;
  }, [sunkOpponentCells]);
}
