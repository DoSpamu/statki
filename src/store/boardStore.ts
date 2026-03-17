import { useState, useMemo, useCallback, useEffect } from 'react';
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

// Sprawdza czy komórki są w granicach planszy i nie nachodzą na istniejące statki
function isValidPlacement(
  cells: [number, number][],
  occupiedSet: Set<string>,
): boolean {
  return cells.every(([r, c]) =>
    r >= 0 && r < 10 && c >= 0 && c < 10 && !occupiedSet.has(`${r},${c}`)
  );
}

export function useBoardStore() {
  const [grid, setGrid]               = useState<BoardGrid>(createEmptyBoard);
  const [phase, setPhase]             = useState<Phase>('placement');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>('carrier');
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCell, setHoverCell]     = useState<[number, number] | null>(null);

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

  // Liczba pozostałych statków każdego typu do postawienia
  const remainingShips = useMemo(() =>
    SHIP_DEFINITIONS.map(def => {
      const placed = placedShips.filter(s => s.type === def.type).length;
      return { ...def, placed, remaining: def.count - placed };
    }),
    [placedShips]
  );

  // Skrót klawiszowy R – obrót statku
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') {
        setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectShip = useCallback((type: ShipType) => {
    setSelectedShip(type);
  }, []);

  const toggleOrientation = useCallback(() => {
    setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoverCell([row, col]);
  }, []);

  const handleBoardLeave = useCallback(() => {
    setHoverCell(null);
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

    // Sprawdź czy wszystkie statki zostały postawione
    const totalToPlace = SHIP_DEFINITIONS.reduce((sum, d) => sum + d.count, 0);
    if (newPlaced.length >= totalToPlace) {
      setPhase('battle');
      setSelectedShip(null);
      setHoverCell(null);
    }
  }

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

  return {
    grid, phase,
    selectedShip, orientation,
    previewCells, previewValid,
    remainingShips,
    selectShip, toggleOrientation,
    handleCellClick, handleCellHover, handleBoardLeave,
  };
}
