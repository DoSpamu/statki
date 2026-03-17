export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface Cell {
  row: number; // 0–9
  col: number; // 0–9
  state: CellState;
}

export type BoardGrid = Cell[][];

// ─── Typy rozstawiania floty ─────────────────────────────────────────────────

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'destroyer';
export type Orientation = 'horizontal' | 'vertical';
export type Phase = 'placement' | 'battle';

export interface ShipDefinition {
  type: ShipType;
  name: string;        // polska nazwa
  callsign: string;    // angielski skrót dla HUD
  size: number;
  count: number;
}

export interface PlacedShip {
  type: ShipType;
  cells: [number, number][];
}

export const SHIP_DEFINITIONS: ShipDefinition[] = [
  { type: 'carrier',    name: 'Lotniskowiec', callsign: 'CVN',  size: 5, count: 1 },
  { type: 'battleship', name: 'Pancernik',    callsign: 'BB',   size: 4, count: 1 },
  { type: 'cruiser',    name: 'Krążownik',    callsign: 'CG',   size: 3, count: 2 },
  { type: 'destroyer',  name: 'Niszczyciel',  callsign: 'DDG',  size: 2, count: 1 },
];
