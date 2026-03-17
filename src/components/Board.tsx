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

// ─── SVG nakładka statku — widok z góry, realistyczna sylwetka ───────────────
function ShipDecal({ type, callsign, orientation, partIndex, shipSize }: CellShipInfo) {
  const { accent } = SHIP_PALETTE[type];
  const isHead   = partIndex === 0;
  const isTail   = partIndex === shipSize - 1;
  const isSolo   = shipSize === 1;
  const isHoriz  = orientation === 'horizontal';
  const isCenter = partIndex === Math.floor(shipSize / 2);

  // Kadłub zajmuje całe pole; dziób/rufa mają zaokrąglone końce
  // Współrzędne dla orientacji poziomej (obrót SVG dla pionowej)
  const hullY1 = 18, hullY2 = 30; // szerokość kadłuba (symetrycznie)
  const hullMid = 24;

  // Krawędzie dzioba i rufy (zaostrzenie)
  const bowX   = isHead  ? (isSolo ? 6  : 2)  : 0;
  const sternX = isTail  ? (isSolo ? 42 : 46) : 48;

  // Wielokąt kadłuba — trapez ze zwężeniem na dziobowej stronie
  const hullPoly = isHead && !isSolo
    ? `${bowX},${hullMid} 6,${hullY1} 48,${hullY1} 48,${hullY2} 6,${hullY2}`
    : isTail && !isSolo
    ? `0,${hullY1} ${sternX},${hullY1} ${sternX - 4},${hullMid} ${sternX},${hullY2} 0,${hullY2}`
    : isSolo
    ? `${bowX},${hullMid} 8,${hullY1} ${sternX - 4},${hullY1} ${sternX},${hullMid} ${sternX - 4},${hullY2} 8,${hullY2}`
    : `0,${hullY1} 48,${hullY1} 48,${hullY2} 0,${hullY2}`;

  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={isHoriz ? undefined : { transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
    >
      {/* ── Kadłub główny ── */}
      <polygon points={hullPoly} fill={accent} opacity={0.18} />
      <polygon points={hullPoly} fill="none" stroke={accent} strokeWidth={1.2} opacity={0.55} />

      {/* ── Linia kilu (oś środkowa) ── */}
      <line x1={0} y1={hullMid} x2={48} y2={hullMid}
        stroke={accent} strokeWidth={0.8} opacity={0.3} />

      {/* ── Pokład — linia wzdłuż statku ── */}
      <line x1={isHead ? bowX + 4 : 0} y1={hullMid}
            x2={isTail ? sternX - 4 : 48} y2={hullMid}
        stroke={accent} strokeWidth={2} opacity={0.7} />

      {/* ── Dziób — zaostrzony trójkąt ── */}
      {(isHead || isSolo) && (
        <polygon
          points={`${bowX},${hullMid} 10,${hullY1 + 1} 10,${hullY2 - 1}`}
          fill={accent} opacity={0.75}
        />
      )}

      {/* ── Rufa — śruba napędowa ── */}
      {(isTail || isSolo) && (
        <>
          <rect x={sternX - 6} y={hullY1 + 2} width={5} height={hullY2 - hullY1 - 4}
            fill={accent} opacity={0.5} rx={1} />
          {/* Śruba: dwa łuki symbolizujące łopaty */}
          <circle cx={sternX - 3} cy={hullMid - 3} r={2}
            fill="none" stroke={accent} strokeWidth={1} opacity={0.6} />
          <circle cx={sternX - 3} cy={hullMid + 3} r={2}
            fill="none" stroke={accent} strokeWidth={1} opacity={0.6} />
        </>
      )}

      {/* ── Nadbudówka zależna od typu statku ── */}

      {/* Lotniskowiec — pas startowy wzdłuż pokładu */}
      {type === 'carrier' && isCenter && (
        <>
          <rect x={10} y={hullY1} width={28} height={3}
            fill={accent} opacity={0.35} />
          <line x1={12} y1={hullY1 + 1.5} x2={36} y2={hullY1 + 1.5}
            stroke={accent} strokeWidth={0.6} strokeDasharray="3 2" opacity={0.7} />
        </>
      )}

      {/* Pancernik — 2 wieżyczki armatnie */}
      {type === 'battleship' && (isHead || isTail) && (
        <circle cx={isHead ? 16 : 32} cy={hullMid} r={4}
          fill={accent} opacity={0.45}
          stroke={accent} strokeWidth={0.8}
        />
      )}
      {type === 'battleship' && isCenter && (
        <circle cx={24} cy={hullMid} r={3}
          fill={accent} opacity={0.35}
          stroke={accent} strokeWidth={0.8}
        />
      )}

      {/* Krążownik — mostek dowodzenia (prostokąt na środku) */}
      {type === 'cruiser' && isCenter && (
        <rect x={16} y={hullY1 + 2} width={16} height={hullY2 - hullY1 - 4}
          fill={accent} opacity={0.4} rx={1}
          stroke={accent} strokeWidth={0.7}
        />
      )}

      {/* Niszczyciel — linia torpedowa + sonar */}
      {type === 'destroyer' && isCenter && (
        <>
          <circle cx={24} cy={hullMid} r={5}
            fill="none" stroke={accent} strokeWidth={0.9} opacity={0.45}
            strokeDasharray="2.5 2"
          />
          <circle cx={24} cy={hullMid} r={1.5}
            fill={accent} opacity={0.6}
          />
        </>
      )}

      {/* ── Callsign na środku ── */}
      {isCenter && (
        <text
          x={24} y={hullY2 + 9}
          textAnchor="middle"
          fontSize={6}
          fill={accent}
          opacity={0.75}
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
  cascadeDelay?: number;
  readonly?: boolean;
  isSunk?: boolean;
  onClick: () => void;
  onHover: () => void;
}

function Cell({ state, shipInfo, isPreview, previewValid, isExcluded, phase, cascadeDelay, readonly, isSunk, onClick, onHover }: CellProps) {
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
  const cascadeStyle = cascadeDelay !== undefined
    ? { animation: `cell-cascade 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${cascadeDelay}s forwards` }
    : undefined;
  // Zatopiony statek — ciemniejszy, wyraźny kolor
  const sunkStyle = isSunk && state === 'hit'
    ? { backgroundColor: '#2a0000', boxShadow: 'inset 0 0 14px 4px #cc000033, 0 0 6px 2px #aa000044', animation: 'none' }
    : undefined;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      disabled={isFinished || readonly}
      className={[
        'relative group w-12 h-12 border border-[#2a3a18]',
        'flex items-center justify-center',
        'transition-colors duration-75 focus:outline-none',
        'focus:ring-1 focus:ring-[#a8cc30] focus:z-10',
        state === 'ship' ? '' : STATE_CSS[state],
        state === 'empty' ? 'bf-empty' : '',
        isPreview ? 'transition-none' : '',
      ].join(' ')}
      style={{ ...shipBgStyle, ...previewStyle, ...cascadeStyle, ...sunkStyle }}
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
      {!isFinished && !isPreview && !readonly && (
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

      {state === 'hit' && !isSunk && (
        <span className="relative z-10 text-[#ff9922] text-base font-black leading-none select-none drop-shadow-[0_0_6px_#ff6600]">
          ✕
        </span>
      )}
      {state === 'hit' && isSunk && (
        <span className="relative z-10 text-[#ff4444] text-base font-black leading-none select-none drop-shadow-[0_0_8px_#cc0000]">
          ☠
        </span>
      )}
      {state === 'miss' && (
        <span className="relative z-10 text-white text-xs font-black leading-none select-none opacity-80">
          ●
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
  exploding?: boolean;
  readonly?: boolean;
  sunkCells?: Set<string>;
}

function buildPreviewSet(cells: [number, number][]): Set<string> {
  return new Set(cells.map(([r, c]) => `${r},${c}`));
}

export default function Board({
  grid, phase, cellShipInfo,
  previewCells, previewValid, excludedCells,
  onCellClick, onCellHover, onBoardLeave, title, exploding, readonly, sunkCells,
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
                    cascadeDelay={exploding
                      ? Math.sqrt((ri - 4.5) ** 2 + (ci - 4.5) ** 2) * 0.07
                      : undefined}
                    readonly={readonly}
                    isSunk={sunkCells?.has(key)}
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
