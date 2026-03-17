import type { BoardGrid, CellState } from '../types/board';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Mapowanie stanu na klasę CSS z animacją / kolorem (zdefiniowane w index.css)
const STATE_CSS: Record<CellState, string> = {
  empty: 'bf-empty',
  ship:  'bf-ship',
  hit:   'bf-hit',
  miss:  'bf-miss',
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
        'relative group w-12 h-12 border border-[#2a3a18]',
        'flex items-center justify-center',
        'transition-colors duration-75 focus:outline-none focus:z-10',
        'focus:ring-1 focus:ring-[#a8cc30]',
        STATE_CSS[state],
      ].join(' ')}
      aria-label={state}
    >
      {/* Narożniki celownika — widoczne na hover */}
      {!isFinished && (
        <>
          <span className="absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
          <span className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
        </>
      )}

      {/* Ikona trafienia */}
      {state === 'hit' && (
        <span className="relative z-10 text-[#ff9922] text-base font-black leading-none select-none drop-shadow-[0_0_6px_#ff6600]">
          ✕
        </span>
      )}

      {/* Ikona chybienia — symbol fali */}
      {state === 'miss' && (
        <span className="relative z-10 text-[#3a8aaa] text-sm font-bold leading-none select-none">
          ◦
        </span>
      )}
    </button>
  );
}

// Ramka taktyczna z narożnikami HUD
function TacticalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-4 bg-[#080c05]">
      {/* Narożniki ramki */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#6a9a20]" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#6a9a20]" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#6a9a20]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#6a9a20]" />

      {/* Skanline overlay — subtelna tekstura ekranu */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] z-20"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)' }}
      />

      {children}
    </div>
  );
}

interface BoardProps {
  grid: BoardGrid;
  onCellClick: (row: number, col: number) => void;
  title?: string;
}

export default function Board({ grid, onCellClick, title }: BoardProps) {
  return (
    <div className="bf-hud flex flex-col items-center gap-3">
      {title && (
        <div className="flex items-center gap-3 w-full">
          {/* Linia dekoracyjna */}
          <div className="flex-1 h-px bg-[#4a6a18]" />
          <span className="text-[#a8cc30] text-xs font-mono font-bold tracking-[0.25em] uppercase">
            {title}
          </span>
          <div className="flex-1 h-px bg-[#4a6a18]" />
        </div>
      )}

      <TacticalFrame>
        <div className="inline-block relative z-10">
          {/* Nagłówek kolumn */}
          <div className="flex ml-12">
            {COL_LABELS.map(label => (
              <div
                key={label}
                className="w-12 h-8 flex items-center justify-center text-[#6a9a20] text-xs font-mono font-bold"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Wiersze planszy — wjeżdżają kolejno z lewej */}
          {grid.map((row, ri) => (
            <div
              key={ri}
              className="flex"
              style={{ animation: `bf-row-in 0.3s ease-out ${ri * 0.04}s both` }}
            >
              {/* Etykieta wiersza */}
              <div className="w-12 h-12 flex items-center justify-center text-[#6a9a20] text-xs font-mono font-bold">
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
      </TacticalFrame>
    </div>
  );
}
