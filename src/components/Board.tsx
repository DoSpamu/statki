import type { BoardGrid, CellState } from '../types/board';

// Etykiety wierszy i kolumn
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Klasy Tailwind dla każdego stanu pola
const STATE_CLASSES: Record<CellState, string> = {
  empty: 'bg-blue-600 hover:bg-blue-400',
  ship:  'bg-gray-500 hover:bg-gray-400',
  hit:   'bg-red-600 cursor-default',
  miss:  'bg-white cursor-default',
};

interface CellProps {
  state: CellState;
  onClick: () => void;
}

function Cell({ state, onClick }: CellProps) {
  const isFinished = state === 'hit' || state === 'miss';

  return (
    <button
      onClick={onClick}
      disabled={isFinished}
      className={[
        'w-9 h-9 border border-blue-900 flex items-center justify-center',
        'transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-yellow-400',
        STATE_CLASSES[state],
      ].join(' ')}
      aria-label={state}
    >
      {/* Krzyżyk na pudle */}
      {state === 'miss' && (
        <span className="text-gray-400 text-lg font-bold leading-none select-none">✕</span>
      )}
      {/* Płomień na trafieniu */}
      {state === 'hit' && (
        <span className="text-yellow-300 text-base leading-none select-none">💥</span>
      )}
    </button>
  );
}

interface BoardProps {
  grid: BoardGrid;
  onCellClick: (row: number, col: number) => void;
  title?: string;
}

export default function Board({ grid, onCellClick, title }: BoardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {title && (
        <h2 className="text-white text-xl font-semibold tracking-wide">{title}</h2>
      )}

      <div className="inline-block">
        {/* Nagłówek kolumn */}
        <div className="flex ml-9">
          {COL_LABELS.map(label => (
            <div
              key={label}
              className="w-9 h-7 flex items-center justify-center text-blue-300 text-xs font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Wiersze planszy */}
        {grid.map((row, ri) => (
          <div key={ri} className="flex">
            {/* Etykieta wiersza */}
            <div className="w-9 h-9 flex items-center justify-center text-blue-300 text-xs font-medium">
              {ROW_LABELS[ri]}
            </div>

            {row.map((cell, ci) => (
              <Cell
                key={ci}
                state={cell.state}
                onClick={() => onCellClick(ri, ci)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
