import type { BoardGrid, CellState } from '../types/board';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Kolory inspirowane Breaking Bad:
//   empty  → meth blue (ciemny niebieskozielony)
//   ship   → hazmat (oliwkowy kombinezon)
//   hit    → spalony pomarańczowo-czerwony (eksplozja laboratorium)
//   miss   → pustynny piasek (pustynia Nowego Meksyku)
const STATE_CLASSES: Record<CellState, string> = {
  empty: 'bg-[#1a3d52] hover:bg-[#2e6e8a] border-[#0e2233]',
  ship:  'bg-[#3b4a1c] hover:bg-[#566a28] border-[#1e2a0a]',
  hit:   'bg-[#7a1e00] border-[#3d0e00] cursor-default',
  miss:  'bg-[#c4a46b] border-[#8a6e3a] cursor-default',
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
        'w-12 h-12 border-2 flex items-center justify-center',
        'transition-colors duration-100',
        'focus:outline-none focus:ring-2 focus:ring-[#e8b84b] focus:z-10',
        STATE_CLASSES[state],
      ].join(' ')}
      aria-label={state}
    >
      {/* Krzyżyk na pudle — ciemnobrązowy jak cień na pustyni */}
      {state === 'miss' && (
        <span className="text-[#5a3a10] text-xl font-black leading-none select-none">✕</span>
      )}
      {/* Trafienie — jaskrawożółty krzyk jak ostrzeżenie Heisenberga */}
      {state === 'hit' && (
        <span className="text-[#e8b84b] text-xl font-black leading-none select-none">☢</span>
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
    <div className="flex flex-col items-center gap-3">
      {title && (
        <h2 className="text-[#e8b84b] text-xl font-bold tracking-widest uppercase">
          {title}
        </h2>
      )}

      <div className="inline-block">
        {/* Nagłówek kolumn */}
        <div className="flex ml-12">
          {COL_LABELS.map(label => (
            <div
              key={label}
              className="w-12 h-8 flex items-center justify-center text-[#e8b84b] text-sm font-bold"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Wiersze planszy */}
        {grid.map((row, ri) => (
          <div key={ri} className="flex">
            {/* Etykieta wiersza */}
            <div className="w-12 h-12 flex items-center justify-center text-[#e8b84b] text-sm font-bold">
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
