import type { BoardGrid, CellState, Phase, CellShipInfo, ShipType } from '../types/board';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// ─── Paleta wizualna statków (BF/Fallout) ────────────────────────────────────
const SHIP_PALETTE: Record<ShipType, { bg: string; accent: string }> = {
  carrier:    { bg: '#0a1c38', accent: '#5a90d8' }, // stalowy błękit — lotniskowiec
  battleship: { bg: '#201400', accent: '#d47c0a' }, // spalone złoto — pancernik
  cruiser:    { bg: '#082818', accent: '#2eb84a' }, // zieleń operacyjna — krążownik
  destroyer:  { bg: '#1c0828', accent: '#c038c0' }, // fiolet stealth — niszczyciel
};

const STATE_CSS: Record<CellState, string> = {
  empty: 'bf-empty',
  ship:  '',           // tło nadpisane inline przez SHIP_PALETTE
  hit:   'bf-hit',
  miss:  'bf-miss',
};

// ─── SVG nakładka statku ─────────────────────────────────────────────────────
function ShipDecal({ type, callsign, orientation, partIndex, shipSize }: CellShipInfo) {
  const { accent } = SHIP_PALETTE[type];
  const isHead   = partIndex === 0;
  const isTail   = partIndex === shipSize - 1;
  const isSolo   = shipSize === 1;
  const isHoriz  = orientation === 'horizontal';
  const isCenter = partIndex === Math.floor(shipSize / 2);

  // Granice kadłuba wzdłuż osi statku (x1→x2 lub y1→y2)
  const spineStart = isHead && !isSolo ? 12 : 0;
  const spineEnd   = isTail && !isSolo ? 36 : 48;

  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {isHoriz ? (
        <>
          {/* Kadłub — prostokąt wzdłuż osi poziomej */}
          <rect x={spineStart} y={17} width={spineEnd - spineStart} height={14}
            fill={accent} opacity={0.22} />

          {/* Kręgosłup (oś statku) */}
          <line x1={spineStart} y1={24} x2={spineEnd} y2={24}
            stroke={accent} strokeWidth={2.5} />

          {/* Żebra kadłuba */}
          {[16, 28, 40].map(x =>
            x > spineStart && x < spineEnd
              ? <line key={x} x1={x} y1={19} x2={x} y2={29}
                  stroke={accent} strokeWidth={1} opacity={0.45} />
              : null
          )}

          {/* Dziób — trójkąt wskazujący w lewo */}
          {(isHead || isSolo) && (
            <polygon points={`${isSolo ? 6 : 4},24 12,17 12,31`}
              fill={accent} opacity={0.85} />
          )}

          {/* Rufa — płyta z kratownicą */}
          {(isTail || isSolo) && (
            <>
              <rect x={isSolo ? 36 : 36} y={16} width={6} height={16}
                fill={accent} opacity={0.75} rx={1} />
              <line x1={isSolo ? 37 : 37} y1={20} x2={isSolo ? 37 : 37} y2={28}
                stroke={accent} strokeWidth={1} opacity={0.4} />
              <line x1={isSolo ? 40 : 40} y1={20} x2={isSolo ? 40 : 40} y2={28}
                stroke={accent} strokeWidth={1} opacity={0.4} />
            </>
          )}
        </>
      ) : (
        <>
          {/* Kadłub pionowy */}
          <rect x={17} y={spineStart} width={14} height={spineEnd - spineStart}
            fill={accent} opacity={0.22} />

          {/* Kręgosłup pionowy */}
          <line x1={24} y1={spineStart} x2={24} y2={spineEnd}
            stroke={accent} strokeWidth={2.5} />

          {/* Żebra */}
          {[16, 28, 40].map(y =>
            y > spineStart && y < spineEnd
              ? <line key={y} x1={19} y1={y} x2={29} y2={y}
                  stroke={accent} strokeWidth={1} opacity={0.45} />
              : null
          )}

          {/* Dziób — trójkąt w górę */}
          {(isHead || isSolo) && (
            <polygon points={`24,${isSolo ? 6 : 4} 17,12 31,12`}
              fill={accent} opacity={0.85} />
          )}

          {/* Rufa — płyta dolna */}
          {(isTail || isSolo) && (
            <>
              <rect x={16} y={isSolo ? 36 : 36} width={16} height={6}
                fill={accent} opacity={0.75} rx={1} />
              <line x1={20} y1={isSolo ? 37 : 37} x2={28} y2={isSolo ? 37 : 37}
                stroke={accent} strokeWidth={1} opacity={0.4} />
              <line x1={20} y1={isSolo ? 40 : 40} x2={28} y2={isSolo ? 40 : 40}
                stroke={accent} strokeWidth={1} opacity={0.4} />
            </>
          )}
        </>
      )}

      {/* Oznaczenie callsign na środkowym polu statku */}
      {isCenter && (
        <text
          x={24} y={27}
          textAnchor="middle"
          fontSize={shipSize === 2 ? 7 : 8}
          fill={accent}
          opacity={0.9}
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing={0.5}
        >
          {callsign}
        </text>
      )}
    </svg>
  );
}

// ─── Cell ────────────────────────────────────────────────────────────────────

interface CellProps {
  state: CellState;
  shipInfo?: CellShipInfo;
  isPreview: boolean;
  previewValid: boolean;
  isExcluded: boolean;
  phase: Phase;
  onClick: () => void;
  onHover: () => void;
}

function Cell({ state, shipInfo, isPreview, previewValid, isExcluded, phase, onClick, onHover }: CellProps) {
  const isFinished = state === 'hit' || state === 'miss';

  const previewStyle = isPreview ? {
    backgroundColor: previewValid ? 'rgba(100,180,30,0.55)' : 'rgba(210,40,20,0.50)',
    boxShadow: previewValid
      ? 'inset 0 0 10px rgba(160,230,50,0.45)'
      : 'inset 0 0 10px rgba(255,80,50,0.45)',
    zIndex: 10,
  } : undefined;

  // Tło pola statku — kolor per typ jednostki
  const shipBgStyle = state === 'ship' && shipInfo && !isPreview
    ? { backgroundColor: SHIP_PALETTE[shipInfo.type].bg }
    : undefined;

  const showExcluded = isExcluded && state === 'empty' && phase === 'placement' && !isPreview;

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
        state === 'ship' ? '' : STATE_CSS[state],
        state === 'empty' ? 'bf-empty' : '',
        isPreview ? 'transition-none' : '',
      ].join(' ')}
      style={{ ...shipBgStyle, ...previewStyle }}
      aria-label={state}
    >
      {/* SVG statku — tylko dla postawionych, nietrafionych */}
      {state === 'ship' && shipInfo && (
        <ShipDecal {...shipInfo} />
      )}

      {/* Strefa wykluczenia */}
      {showExcluded && (
        <span className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, #3a5020 1px, transparent 1px)', backgroundSize: '6px 6px', backgroundPosition: 'center' }}
        />
      )}

      {/* Narożniki celownika na hover */}
      {!isFinished && !isPreview && (
        <>
          <span className="absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75 z-20" />
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75 z-20" />
          <span className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75 z-20" />
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#a8cc30] opacity-0 group-hover:opacity-100 transition-opacity duration-75 z-20" />
        </>
      )}

      {/* Narożniki podglądu */}
      {isPreview && (
        <>
          <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
          <span className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
          <span className={`absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
          <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 ${previewValid ? 'border-[#c8f050]' : 'border-[#ff6040]'}`} />
        </>
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

// ─── Ramka taktyczna ─────────────────────────────────────────────────────────
function TacticalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-4 bg-[#080c05]">
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#6a9a20]" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#6a9a20]" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#6a9a20]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#6a9a20]" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] z-20"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,#000 0px,#000 1px,transparent 1px,transparent 3px)' }}
      />
      {children}
    </div>
  );
}

// ─── Board ───────────────────────────────────────────────────────────────────
interface BoardProps {
  grid: BoardGrid;
  phase: Phase;
  cellShipInfo: Map<string, CellShipInfo>;
  previewCells: [number, number][];
  previewValid: boolean;
  excludedCells: Set<string>;
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  onBoardLeave: () => void;
  title?: string;
}

function buildPreviewSet(cells: [number, number][]): Set<string> {
  return new Set(cells.map(([r, c]) => `${r},${c}`));
}

export default function Board({
  grid, phase, cellShipInfo,
  previewCells, previewValid, excludedCells,
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
        <div className="inline-block relative z-10" onMouseLeave={onBoardLeave}>
          {/* Nagłówek kolumn */}
          <div className="flex ml-12">
            {COL_LABELS.map(label => (
              <div key={label} className="w-12 h-8 flex items-center justify-center text-[#6a9a20] text-xs font-mono font-bold">
                {label}
              </div>
            ))}
          </div>

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
                const key = `${ri},${ci}`;
                return (
                  <Cell
                    key={ci}
                    state={cell.state}
                    shipInfo={cellShipInfo.get(key)}
                    isPreview={previewSet.has(key)}
                    previewValid={previewValid}
                    isExcluded={excludedCells.has(key)}
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
