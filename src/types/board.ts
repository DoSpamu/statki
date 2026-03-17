export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface Cell {
  row: number; // 0–9
  col: number; // 0–9
  state: CellState;
}

export type BoardGrid = Cell[][];
