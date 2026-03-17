import type { BoardGrid, CellState, Phase, CellShipInfo, ShipType } from '../types/board';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// ─── Paleta wizualna statków — militarna oliwa ───────────────────────────────
const SHIP_PALETTE: Record<ShipType, { bg: string; accent: string }> = {
  carrier:    { bg: '#111a07', accent: '#88b825' }, // oliwkowy kamuflaż — lotniskowiec
  battleship: { bg: '#0b1205', accent: '#4a7818' }, // ciemna oliwa (styl sub) — pancernik
  cruiser:    { bg: '#101607', accent: '#70a020' }, // średnia oliwa — krążownik
  destroyer:  { bg: '#111a07', accent: '#a8cc30' }, // jasna oliwa — niszczyciel
};

// Kolory struktury kadłuba per typ
const SHIP_HULL_COLORS: Record<ShipType, { hull: string; panel: string; line: string }> = {
  carrier:    { hull: '#3a4e16', panel: '#2c3e10', line: '#1e2c0a' },
  battleship: { hull: '#1a2a08', panel: '#131e06', line: '#0c1404' },
  cruiser:    { hull: '#304010', panel: '#22300c', line: '#161e08' },
  destroyer:  { hull: '#3c5016', panel: '#2a3c10', line: '#1c2a08' },
};

const STATE_CSS: Record<CellState, string> = {
  empty: 'bf-empty',
  ship:  '',           // tło nadpisane inline przez SHIP_PALETTE
  hit:   'bf-hit',
  miss:  'bf-miss',
};

// ─── SVG nakładka statku — widok z góry, styl militarny ─────────────────────
function ShipDecal({ type, callsign, orientation, partIndex, shipSize }: CellShipInfo) {
  const { accent } = SHIP_PALETTE[type];
  const { hull, panel, line } = SHIP_HULL_COLORS[type];

  const isHead   = partIndex === 0;
  const isTail   = partIndex === shipSize - 1;
  const isSolo   = shipSize === 1;
  const isCenter = partIndex === Math.floor(shipSize / 2);
  const isHoriz  = orientation === 'horizontal';

  // Granice kadłuba per typ (y od góry, statek biegnie poziomo)
  const Y: Record<ShipType, [number, number]> = {
    carrier:    [10, 38],
    battleship: [11, 37],
    cruiser:    [14, 34],
    destroyer:  [16, 32],
  };
  const [y1, y2] = Y[type];
  const yMid = 24;
  const hh = y2 - y1; // wysokość kadłuba

  // ─── Kształt kadłuba ──────────────────────────────────────────────────────
  let hullPts: string;
  if (isSolo) {
    hullPts = `5,${yMid} 9,${y1} 39,${y1} 43,${yMid} 39,${y2} 9,${y2}`;
  } else if (isHead) {
    const bx = type === 'cruiser' ? 3 : type === 'battleship' ? 7 : type === 'destroyer' ? 5 : 9;
    const bw = type === 'cruiser' ? 9 : 10;
    hullPts = `${bx},${yMid} ${bx + bw},${y1} 48,${y1} 48,${y2} ${bx + bw},${y2}`;
  } else if (isTail) {
    const tw = type === 'battleship' ? 9 : type === 'carrier' ? 9 : 7;
    hullPts = `0,${y1} ${48 - tw},${y1} ${48 - tw + 5},${yMid} ${48 - tw},${y2} 0,${y2}`;
  } else {
    hullPts = `0,${y1} 48,${y1} 48,${y2} 0,${y2}`;
  }

  // Pionowe linie podziału paneli (siatka pancerna)
  const panelXs = type === 'carrier'
    ? [10, 20, 30, 40]
    : type === 'battleship'
    ? [12, 24, 36]
    : [12, 28];

  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={isHoriz ? undefined : { transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
    >
      {/* ── Kadłub ── */}
      <polygon points={hullPts} fill={hull} />
      {/* Wewnętrzna poświata akcentu */}
      <polygon points={hullPts} fill={accent} opacity="0.05" />
      {/* Obrys — gruba ciemna, cienka jasna */}
      <polygon points={hullPts} fill="none" stroke={line} strokeWidth="1.5" />
      <polygon points={hullPts} fill="none" stroke={accent} strokeWidth="0.5" opacity="0.45" />

      {/* ── Siatka paneli ── */}
      {panelXs.map(x => (
        <line key={x} x1={x} y1={y1} x2={x} y2={y2}
          stroke={line} strokeWidth="0.7" opacity="0.9" />
      ))}
      {/* Poziome linie podziału */}
      <line x1={isHead ? (type === 'cruiser' ? 12 : 18) : 0} y1={y1 + hh / 3}
            x2={isTail ? 40 : 48} y2={y1 + hh / 3}
        stroke={line} strokeWidth="0.6" opacity="0.8" />
      <line x1={isHead ? (type === 'cruiser' ? 12 : 18) : 0} y1={y1 + 2 * hh / 3}
            x2={isTail ? 40 : 48} y2={y1 + 2 * hh / 3}
        stroke={line} strokeWidth="0.6" opacity="0.8" />

      {/* ═══════════════════════════════════════════════════════════════════
          Detale per TYP
          ═══════════════════════════════════════════════════════════════ */}

      {/* ─── LOTNISKOWIEC (szeroki, siatka pancerna, wyspa, pas startowy) ─ */}
      {type === 'carrier' && (
        <>
          {/* Pas startowy — przerywaną linią blisko górnej krawędzi */}
          <line
            x1={isHead ? 20 : 0} y1={y1 + 5}
            x2={isTail ? 38 : 48} y2={y1 + 5}
            stroke={accent} strokeWidth="1.4" opacity="0.5" strokeDasharray="5 3"
          />
          {/* Wyspa — superstruktura w komórce centralnej */}
          {isCenter && (
            <>
              <rect x={4} y={y1 - 1} width={24} height={10} fill={panel} stroke={accent} strokeWidth="0.8" />
              <rect x={6} y={y1 + 1} width={4} height={6} fill={accent} opacity="0.3" />
              <rect x={12} y={y1 + 1} width={5} height={6} fill={accent} opacity="0.25" />
              <rect x={19} y={y1 + 1} width={5} height={6} fill={accent} opacity="0.3" />
              {/* Maszt radarowy */}
              <line x1={11} y1={y1 - 1} x2={11} y2={y1 - 7} stroke={accent} strokeWidth="0.9" opacity="0.8" />
              <line x1={8}  y1={y1 - 6} x2={14} y2={y1 - 6} stroke={accent} strokeWidth="0.7" opacity="0.55" />
              <line x1={11} y1={y1 - 6} x2={11} y2={y1 - 4} stroke={accent} strokeWidth="0.7" opacity="0.55" />
            </>
          )}
          {/* Winda na rufie */}
          {isTail && (
            <rect x={5} y={y2 - 10} width={16} height={8}
              fill={panel} stroke={accent} strokeWidth="0.7" opacity="0.75" />
          )}
        </>
      )}

      {/* ─── PANCERNIK (ciemny owalny kadłub, ośmiokątne wieżyczki) ──────── */}
      {type === 'battleship' && (
        <>
          {isHead && (
            // Dziobowa wieżyczka — trapezoid
            <polygon
              points={`12,${yMid} 16,${y1 + 4} 32,${y1 + 4} 32,${y2 - 4} 16,${y2 - 4}`}
              fill={panel} stroke={accent} strokeWidth="0.8" opacity="0.9"
            />
          )}
          {!isHead && !isTail && (
            // Główna wieżyczka — duży ośmiokąt
            <>
              <polygon
                points={`5,${yMid} 9,${y1 + 3} 39,${y1 + 3} 43,${yMid} 39,${y2 - 3} 9,${y2 - 3}`}
                fill={panel} stroke={accent} strokeWidth="0.9" opacity="0.85"
              />
              <polygon
                points={`13,${yMid} 16,${y1 + 7} 32,${y1 + 7} 35,${yMid} 32,${y2 - 7} 16,${y2 - 7}`}
                fill={hull} stroke={accent} strokeWidth="0.6" opacity="0.7"
              />
              {/* Centralny element wieżyczki */}
              <rect x={19} y={yMid - 4} width={10} height={8} rx="1"
                fill={accent} opacity="0.25" stroke={accent} strokeWidth="0.5" />
              <line x1={24} y1={yMid - 7} x2={24} y2={yMid + 7}
                stroke={accent} strokeWidth="0.7" opacity="0.5" />
            </>
          )}
          {isTail && (
            // Rufowa wieżyczka
            <polygon
              points={`16,${y1 + 4} 32,${y1 + 4} 36,${yMid} 32,${y2 - 4} 16,${y2 - 4}`}
              fill={panel} stroke={accent} strokeWidth="0.8" opacity="0.9"
            />
          )}
        </>
      )}

      {/* ─── KRĄŻOWNIK (zaostrzony dziób, wieżyczka, śruby) ─────────────── */}
      {type === 'cruiser' && (
        <>
          {isHead && (
            // Ostry dziób z trójkątem + frontalny kadłub
            <>
              <polygon
                points={`3,${yMid} 12,${y1} 32,${y1} 32,${y2} 12,${y2}`}
                fill={panel} stroke={accent} strokeWidth="0.7" opacity="0.8"
              />
              {/* Ostry punkt dziobu */}
              <polygon
                points={`3,${yMid} 10,${y1 + 4} 10,${y2 - 4}`}
                fill={accent} opacity="0.6"
              />
            </>
          )}
          {!isHead && !isTail && (
            // Ośmiokątna wieżyczka główna + lufa
            <>
              <polygon
                points={`6,${yMid} 10,${y1 + 2} 38,${y1 + 2} 42,${yMid} 38,${y2 - 2} 10,${y2 - 2}`}
                fill={panel} stroke={accent} strokeWidth="0.8" opacity="0.85"
              />
              <rect x={16} y={yMid - 5} width={16} height={10} rx="1"
                fill={hull} stroke={accent} strokeWidth="0.6" opacity="0.8"
              />
              {/* Lufa — pozioma linia */}
              <line x1={2} y1={yMid} x2={16} y2={yMid}
                stroke={accent} strokeWidth="1.4" opacity="0.65" />
            </>
          )}
          {isTail && (
            // Tylna nadbudówka + śruby
            <>
              <rect x={6} y={y1 + 3} width={22} height={hh - 6} rx="1"
                fill={panel} stroke={accent} strokeWidth="0.7" opacity="0.8"
              />
              <circle cx={35} cy={yMid - 4} r="3.5"
                fill="none" stroke={accent} strokeWidth="0.8" opacity="0.65" />
              <circle cx={35} cy={yMid + 4} r="3.5"
                fill="none" stroke={accent} strokeWidth="0.8" opacity="0.65" />
            </>
          )}
        </>
      )}

      {/* ─── NISZCZYCIEL (owalny/teardrop, wieżyczka, śruby) ────────────── */}
      {type === 'destroyer' && (
        <>
          {(isHead || isSolo) && (
            // Owalny dziób z armatą
            <>
              <ellipse
                cx={isSolo ? 22 : 20} cy={yMid}
                rx={isSolo ? 14 : 13} ry={hh / 2 - 1}
                fill={panel} stroke={accent} strokeWidth="0.8" opacity="0.8"
              />
              {/* Ośmiokątna wieżyczka */}
              <polygon
                points={`${isSolo ? 13 : 11},${yMid} ${isSolo ? 15 : 13},${yMid - 5} ${isSolo ? 21 : 19},${yMid - 5} ${isSolo ? 23 : 21},${yMid} ${isSolo ? 21 : 19},${yMid + 5} ${isSolo ? 15 : 13},${yMid + 5}`}
                fill={hull} stroke={accent} strokeWidth="0.7" opacity="0.9"
              />
              {/* Antena/maszt */}
              {!isSolo && (
                <>
                  <line x1={20} y1={y1} x2={20} y2={y1 - 6} stroke={accent} strokeWidth="0.9" opacity="0.75" />
                  <line x1={17} y1={y1 - 5} x2={23} y2={y1 - 5} stroke={accent} strokeWidth="0.7" opacity="0.5" />
                </>
              )}
            </>
          )}
          {(isTail || isSolo) && !isHead && (
            // Rufowy prostokąt + śruby
            <>
              <rect x={5} y={y1 + 2} width={22} height={hh - 4} rx="1"
                fill={panel} stroke={accent} strokeWidth="0.7" opacity="0.8"
              />
              <circle cx={33} cy={yMid - 3} r="3"
                fill="none" stroke={accent} strokeWidth="0.8" opacity="0.65" />
              <circle cx={33} cy={yMid + 3} r="3"
                fill="none" stroke={accent} strokeWidth="0.8" opacity="0.65" />
            </>
          )}
        </>
      )}

      {/* ── Callsign na środku ── */}
      {isCenter && (
        <text
          x={24} y={y2 + 9}
          textAnchor="middle" fontSize="6"
          fill={accent} opacity="0.7"
          fontFamily="monospace" fontWeight="bold" letterSpacing="0.5"
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
