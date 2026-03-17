import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  SHIP_DEFINITIONS,
  type BoardGrid, type CellState,
  type ShipType, type Orientation, type Phase, type PlacedShip,
} from '../types/board';

function createEmptyBoard(): BoardGrid {
  return Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 10 }, (_, col) => ({ row, col, state: 'empty' as CellState }))
  );
}

// Zwraca komórki jakie zajmie statek przy danych parametrach
function getPreviewCells(
  row: number, col: number,
  size: number,
  orientation: Orientation,
): [number, number][] {
  return Array.from({ length: size }, (_, i) =>
    orientation === 'horizontal'
      ? [row, col + i] as [number, number]
      : [row + i, col] as [number, number]
  );
}

// Sprawdza czy komórki mieszczą się w planszy, nie nachodzą na istniejące statki
// i nie stykają się z nimi (żaden sąsiad 8-kierunkowy nie może być zajęty)
function isValidPlacement(
  cells: [number, number][],
  occupiedSet: Set<string>,
): boolean {
  if (!cells.every(([r, c]) => r >= 0 && r < 10 && c >= 0 && c < 10)) return false;
  for (const [r, c] of cells) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (occupiedSet.has(`${r + dr},${c + dc}`)) return false;
      }
    }
  }
  return true;
}

// Zbiór wszystkich komórek sąsiadujących z postawionymi statkami (strefa wykluczenia)
function buildExcludedSet(placedShips: { cells: [number, number][] }[]): Set<string> {
  const excluded = new Set<string>();
  for (const ship of placedShips) {
    for (const [r, c] of ship.cells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) excluded.add(`${nr},${nc}`);
        }
      }
    }
  }
  return excluded;
}

// Generuje losowe, poprawne rozmieszczenie wszystkich statków
function generateRandomPlacement(): { ships: PlacedShip[], grid: BoardGrid } {
  const grid = createEmptyBoard();
  const ships: PlacedShip[] = [];
  const occupied = new Set<string>();

  for (const def of SHIP_DEFINITIONS) {
    for (let n = 0; n < def.count; n++) {
      let placed = false;
      // Maksymalnie 1000 prób na statek (w praktyce kilka wystarcza)
      for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
        const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const cells = getPreviewCells(row, col, def.size, orientation);
        if (isValidPlacement(cells, occupied)) {
          ships.push({ type: def.type, cells });
          for (const [r, c] of cells) {
            occupied.add(`${r},${c}`);
            grid[r][c] = { row: r, col: c, state: 'ship' };
          }
          placed = true;
        }
      }
      // Jeśli nie udało się — rekurencja (bardzo rzadki przypadek)
      if (!placed) return generateRandomPlacement();
    }
  }
  return { ships, grid };
}

export function useBoardStore() {
  const [grid, setGrid]               = useState<BoardGrid>(createEmptyBoard);
  const [phase, setPhase]             = useState<Phase>('placement');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>('carrier');
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCell, setHoverCell]     = useState<[number, number] | null>(null);

  // Refs używane w event listenerze (unikają stale closure z deps: [])
  const phaseRef          = useRef(phase);
  phaseRef.current        = phase;
  const placeshipRef      = useRef<() => void>(() => {});
  // keyboardCursor=true gdy ostatni ruch kursora był klawiaturą — nie czyścimy wtedy na mouseLeave
  const keyboardCursorRef = useRef(false);

  // Zbiór zajętych pól (dla szybkiego sprawdzania kolizji)
  const occupiedSet = useMemo<Set<string>>(() =>
    new Set(placedShips.flatMap(s => s.cells.map(([r, c]) => `${r},${c}`))),
    [placedShips]
  );

  // Komórki podglądu przy aktualnym hover
  const previewCells = useMemo<[number, number][]>(() => {
    if (!selectedShip || !hoverCell || phase !== 'placement') return [];
    const def = SHIP_DEFINITIONS.find(d => d.type === selectedShip)!;
    return getPreviewCells(hoverCell[0], hoverCell[1], def.size, orientation);
  }, [selectedShip, hoverCell, orientation, phase]);

  const previewValid = useMemo<boolean>(() =>
    previewCells.length > 0 && isValidPlacement(previewCells, occupiedSet),
    [previewCells, occupiedSet]
  );

  // Strefa wykluczenia — komórki sąsiadujące z postawionymi statkami
  const excludedCells = useMemo<Set<string>>(
    () => buildExcludedSet(placedShips),
    [placedShips]
  );

  // Liczba pozostałych statków każdego typu do postawienia
  const remainingShips = useMemo(() =>
    SHIP_DEFINITIONS.map(def => {
      const placed = placedShips.filter(s => s.type === def.type).length;
      return { ...def, placed, remaining: def.count - placed };
    }),
    [placedShips]
  );

  // Obsługa klawiatury — strzałki, R, Enter/Space
  // Deps: [] — używamy refów żeby uniknąć stale closure
  useEffect(() => {
    const ARROW_DELTAS: Record<string, [number, number]> = {
      ArrowUp:    [-1,  0],
      ArrowDown:  [ 1,  0],
      ArrowLeft:  [ 0, -1],
      ArrowRight: [ 0,  1],
    };

    function onKeyDown(e: KeyboardEvent) {
      if (phaseRef.current !== 'placement') return;

      // R — obrót statku
      if (e.key === 'r' || e.key === 'R') {
        setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
        return;
      }

      // Strzałki — nawigacja po siatce, blokujemy domyślny scroll
      if (ARROW_DELTAS[e.key]) {
        e.preventDefault();
        keyboardCursorRef.current = true;
        const [dr, dc] = ARROW_DELTAS[e.key];
        setHoverCell(prev => {
          const [r, c] = prev ?? [0, 0];
          return [
            Math.max(0, Math.min(9, r + dr)),
            Math.max(0, Math.min(9, c + dc)),
          ];
        });
        return;
      }

      // Enter / Space — postaw statek w aktualnej pozycji
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        placeshipRef.current();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectShip = useCallback((type: ShipType) => {
    setSelectedShip(type);
  }, []);

  const toggleOrientation = useCallback(() => {
    setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);

  // Mysz wchodzi na pole — przechwytuje kursor od klawiatury
  const handleCellHover = useCallback((row: number, col: number) => {
    keyboardCursorRef.current = false;
    setHoverCell([row, col]);
  }, []);

  // Mysz opuszcza planszę — czyścimy tylko jeśli kursor nie jest klawiaturowy
  const handleBoardLeave = useCallback(() => {
    if (!keyboardCursorRef.current) setHoverCell(null);
  }, []);

  // Kliknięcie podczas rozstawiania — stawia statek
  function placeship() {
    if (!previewValid || !selectedShip) return;

    const newShip: PlacedShip = { type: selectedShip, cells: previewCells };
    const newPlaced = [...placedShips, newShip];

    // Aktualizacja siatki
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })));
      for (const [r, c] of previewCells) {
        next[r][c] = { row: r, col: c, state: 'ship' };
      }
      return next;
    });
    setPlacedShips(newPlaced);

    // Wybierz następny dostępny typ statku (lub odznacz jeśli wszystko postawione)
    const def = SHIP_DEFINITIONS.find(d => d.type === selectedShip)!;
    const alreadyPlaced = newPlaced.filter(s => s.type === selectedShip).length;
    if (alreadyPlaced >= def.count) {
      const next = SHIP_DEFINITIONS.find(d => {
        const count = newPlaced.filter(s => s.type === d.type).length;
        return count < d.count;
      });
      setSelectedShip(next?.type ?? null);
    }

    placeshipRef.current = placeship; // Aktualizuj ref zaraz po definicji

    // Po postawieniu wszystkich statków odznacz selekcję — gracz musi kliknąć GOTOWY
    const totalToPlace = SHIP_DEFINITIONS.reduce((sum, d) => sum + d.count, 0);
    if (newPlaced.length >= totalToPlace) {
      setSelectedShip(null);
      setHoverCell(null);
    }
  }

  // Gracz potwierdza gotowość — przejście do fazy walki
  const confirmReady = useCallback(() => {
    const totalToPlace = SHIP_DEFINITIONS.reduce((sum, d) => sum + d.count, 0);
    if (placedShips.length >= totalToPlace) setPhase('battle');
  }, [placedShips.length]);

  // Losowe rozmieszczenie wszystkich statków (z zachowaniem reguł sąsiedztwa)
  const randomizePlacement = useCallback(() => {
    const result = generateRandomPlacement();
    setGrid(result.grid);
    setPlacedShips(result.ships);
    setSelectedShip(null);
    setHoverCell(null);
  }, []);

  // Kliknięcie podczas walki — strzał
  function fireShot(row: number, col: number) {
    setGrid(prev => {
      const current = prev[row][col].state;
      if (current !== 'empty' && current !== 'ship') return prev;
      return prev.map((r, ri) =>
        r.map((c, ci) =>
          ri === row && ci === col
            ? { ...c, state: current === 'ship' ? 'hit' : 'miss' }
            : c
        )
      );
    });
  }

  function handleCellClick(row: number, col: number) {
    if (phase === 'placement') placeship();
    else fireShot(row, col);
  }

  const allShipsPlaced = placedShips.length >= SHIP_DEFINITIONS.reduce((s, d) => s + d.count, 0);

  return {
    grid, phase,
    selectedShip, orientation,
    previewCells, previewValid,
    excludedCells,
    remainingShips,
    allShipsPlaced,
    selectShip, toggleOrientation,
    confirmReady, randomizePlacement,
    handleCellClick, handleCellHover, handleBoardLeave,
  };
}
