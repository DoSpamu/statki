import type { BoardGrid, CellState, Phase } from '../types/board';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const STATE_CSS: Record<CellState, string> = {
  empty: 'bf-empty',
  ship:  'bf-ship',
  hit:   'bf-hit',
  miss:  'bf-miss',
};

interface CellProps {
  state: CellState;
  isPreview: boolean;
  previewValid: boolean;
  isExcluded: boolean;   // w strefie wykluczenia sąsiadującego statku
  phase: Phase;
  onClick: () => void;
  onHover: () => void;
}

function Cell({ state, isPreview, previewValid, isExcluded, phase, onClick, onHover }: CellProps) {
  const isFinished = state === 'hit' || state === 'miss';
  // Strefa wykluczenia widoczna tylko podczas fazy rozstawiania na pustych polach
  const showExcluded = isExcluded && state === 'empty' && phase === 'placement' && !isPreview;

  // Styl podglądu rozmieszczenia statku — nadpisuje kolor tła
  const previewStyle = isPreview ? {
    backgroundColor: previewValid
      ? 'rgba(100, 180, 30, 0.55)'
      : 'rgba(210, 40, 20, 0.50)',
    boxShadow: previewValid
      ? 'inset 0 0 10px rgba(160, 230, 50, 0.45)'
      : 'inset 0 0 10px rgba(255, 80, 50, 0.45)',
    zIndex: 10,
  } : undefined;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      disabled={isFinished}
      className={[
        'relative group w-12 h-12 border border-[#2a3a18]',
        'flex items-center justify-center',
        'transition-colors duration-75 focus:outline-none',
        'focus:ring-1 focus:ring-[#a8cc30] focus:z-10',
        STATE_CSS[state],
        isPreview ? 'transition-none' : '',
      ].join(' ')}
      style={previewStyle}
      aria-label={state}
    >
      {/* Narożniki celownika na hover (tylko aktywne pola) */}
      {!isFinished && !isPreview && (
        <>
          <span className="absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
          <span className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
        </>
      )}

      {/* Narożniki podglądu — zawsze widoczne gdy pole jest podglądem */}
      {isPreview && (
        <>
          <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
          <span className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
          <span className={`absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
          <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
        </>
      )}

      {/* Marker strefy wykluczenia — subtelna kratka */}
      {showExcluded && (
        <span className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, #3a5020 1px, transparent 1px)', backgroundSize: '6px 6px', backgroundPosition: 'center' }}
        />
      )}

      {state === 'hit' && (
        <span className="relative z-10 text-[#ff9922] text-base font-black leading-none select-none drop-shadow-[0_0_6px_#ff6600]">
          ✕
        </span>
      )}
      {state === 'miss' && (
        <span className="relative z-10 text-[#3a8aaa] text-sm font-bold leading-none select-none">
          ◦
        </span>
      )}
    </button>
  );
}

// Ramka taktyczna HUD z narożnikami
function TacticalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-4 bg-[#080c05]">
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#6a9a20]" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#6a9a20]" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#6a9a20]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#6a9a20]" />
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
  phase: Phase;
  previewCells: [number, number][];
  previewValid: boolean;
  excludedCells: Set<string>;
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  onBoardLeave: () => void;
  title?: string;
}

// Zbiór podglądowych komórek dla szybkiego sprawdzania
function buildPreviewSet(cells: [number, number][]): Set<string> {
  return new Set(cells.map(([r, c]) => `${r},${c}`));
}

export default function Board({
  grid, phase, previewCells, previewValid, excludedCells,
  onCellClick, onCellHover, onBoardLeave, title,
}: BoardProps) {
  const previewSet = buildPreviewSet(previewCells);

  return (
    <div className="bf-hud flex flex-col items-center gap-3">
      {title && (
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-[#4a6a18]" />
          <span className="text-[#a8cc30] text-xs font-mono font-bold tracking-[0.25em] uppercase">
            {title}
          </span>
          <div className="flex-1 h-px bg-[#4a6a18]" />
        </div>
      )}

      <TacticalFrame>
        <div
          className="inline-block relative z-10"
          onMouseLeave={onBoardLeave}
        >
          {/* Nagłówek kolumn */}
          <div className="flex ml-12">
            {COL_LABELS.map(label => (
              <div key={label} className="w-12 h-8 flex items-center justify-center text-[#6a9a20] text-xs font-mono font-bold">
                {label}
              </div>
            ))}
          </div>

          {/* Wiersze */}
          {grid.map((row, ri) => (
            <div
              key={ri}
              className="flex"
              style={{ animation: `bf-row-in 0.3s ease-out ${ri * 0.04}s both` }}
            >
              <div className="w-12 h-12 flex items-center justify-center text-[#6a9a20] text-xs font-mono font-bold">
                {ROW_LABELS[ri]}
              </div>
              {row.map((cell, ci) => {
                const isPrev = previewSet.has(`${ri},${ci}`);
                return (
                  <Cell
                    key={ci}
                    state={cell.state}
                    isPreview={isPrev}
                    previewValid={previewValid}
                    isExcluded={excludedCells.has(`${ri},${ci}`)}
                    phase={phase}
                    onClick={() => onCellClick(ri, ci)}
                    onHover={() => onCellHover(ri, ci)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </TacticalFrame>
    </div>
  );
}
