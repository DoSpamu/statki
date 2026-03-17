import type { PlacedShip } from '../types/board';
import { SHIP_DEFINITIONS } from '../types/board';

// Losowe rozstawianie statków AI (z buforem 1 pola między statkami)
export function randomPlaceShips(): PlacedShip[] {
  const result: PlacedShip[] = [];
  const occupied = new Set<string>();

  for (const def of SHIP_DEFINITIONS) {
    for (let n = 0; n < def.count; n++) {
      let placed = false;
      while (!placed) {
        const horiz = Math.random() < 0.5;
        const maxR = horiz ? 9 : 10 - def.size;
        const maxC = horiz ? 10 - def.size : 9;
        const r0 = Math.floor(Math.random() * (maxR + 1));
        const c0 = Math.floor(Math.random() * (maxC + 1));

        const cells: [number, number][] = Array.from({ length: def.size }, (_, i) =>
          horiz ? [r0, c0 + i] as [number, number] : [r0 + i, c0] as [number, number],
        );

        // Sprawdź nakładanie z buforem 1 pola
        let valid = true;
        outer: for (const [r, c] of cells) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (occupied.has(`${r + dr},${c + dc}`)) { valid = false; break outer; }
            }
          }
        }

        if (valid) {
          cells.forEach(([r, c]) => occupied.add(`${r},${c}`));
          result.push({ type: def.type, cells });
          placed = true;
        }
      }
    }
  }
  return result;
}

// Wybór następnego pola do ostrzału (tryb polowania + celowania)
export function aiPickShot(
  shotHistory: Set<string>,
  hitQueue: [number, number][],
): [number, number] {
  // Tryb celowania — sąsiedzi poprzedniego trafienia
  const validQueue = hitQueue.filter(([r, c]) => !shotHistory.has(`${r},${c}`));
  if (validQueue.length > 0) {
    return validQueue[Math.floor(Math.random() * validQueue.length)];
  }

  // Tryb polowania — wzorzec szachownicy (statystycznie efektywny dla min. rozmiaru 2)
  const hunt: [number, number][] = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++)
      if (!shotHistory.has(`${r},${c}`) && (r + c) % 2 === 0) hunt.push([r, c]);

  if (hunt.length > 0) return hunt[Math.floor(Math.random() * hunt.length)];

  // Fallback — dowolne niestrzelane pole
  const all: [number, number][] = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++)
      if (!shotHistory.has(`${r},${c}`)) all.push([r, c]);

  return all[Math.floor(Math.random() * all.length)];
}

// Sąsiedzi pola (4 kierunki, w granicach planszy)
export function adjacentCells(row: number, col: number): [number, number][] {
  return (([[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][])
    .map(([dr, dc]) => [row + dr, col + dc] as [number, number])
    .filter(([r, c]) => r >= 0 && r < 10 && c >= 0 && c < 10));
}
