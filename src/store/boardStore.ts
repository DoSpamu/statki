import { useState } from 'react';
import type { BoardGrid, CellState } from '../types/board';

// Tworzy pustą planszę 10×10
function createEmptyBoard(): BoardGrid {
  return Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 10 }, (_, col) => ({ row, col, state: 'empty' as CellState }))
  );
}

// Przykładowe statki do testów (współrzędne [wiersz, kolumna])
const TEST_SHIPS: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], // statek 4-masztowy
  [2, 5], [2, 6], [2, 7],          // statek 3-masztowy
  [5, 2], [5, 3],                  // statek 2-masztowy
  [8, 8],                          // statek 1-masztowy
];

function createTestBoard(): BoardGrid {
  const board = createEmptyBoard();
  for (const [r, c] of TEST_SHIPS) {
    board[r][c] = { row: r, col: c, state: 'ship' };
  }
  return board;
}

export function useBoardStore() {
  const [grid, setGrid] = useState<BoardGrid>(createTestBoard);

  function handleCellClick(row: number, col: number) {
    setGrid(prev => {
      const current = prev[row][col].state;
      // Kliknięcie na pole puste lub statek — ustalamy wynik strzału
      if (current === 'empty') {
        return prev.map((r, ri) =>
          r.map((c, ci) => (ri === row && ci === col ? { ...c, state: 'miss' } : c))
        );
      }
      if (current === 'ship') {
        return prev.map((r, ri) =>
          r.map((c, ci) => (ri === row && ci === col ? { ...c, state: 'hit' } : c))
        );
      }
      return prev; // trafione/pudła są niezmienne
    });
  }

  return { grid, handleCellClick };
}
