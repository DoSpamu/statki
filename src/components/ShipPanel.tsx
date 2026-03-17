import type { ShipType, Orientation, Phase } from '../types/board';
import { SHIP_DEFINITIONS } from '../types/board';

interface ShipItemProps {
  type: ShipType;
  name: string;
  callsign: string;
  size: number;
  remaining: number;
  placed: number;
  total: number;
  isSelected: boolean;
  isDeployed: boolean;         // wszystkie sztuki tego typu postawione
  orientation: Orientation;
  onSelect: () => void;
}

function ShipItem({
  type, callsign, name, size,
  remaining, placed, total,
  isSelected, isDeployed,
  orientation, onSelect,
}: ShipItemProps) {
  return (
    <button
      onClick={onSelect}
      disabled={isDeployed}
      className={[
        'w-full text-left px-3 py-2.5 border transition-all duration-150 font-mono',
        'focus:outline-none focus:ring-1 focus:ring-[#a8cc30]',
        isSelected
          ? 'border-[#a8cc30] bg-[#1a2a08] shadow-[0_0_12px_rgba(168,204,48,0.25)]'
          : isDeployed
            ? 'border-[#2a3a18] bg-[#0a0e06] opacity-50 cursor-default'
            : 'border-[#2a3a18] bg-[#0d1208] hover:border-[#5a7a28] hover:bg-[#121a08]',
      ].join(' ')}
    >
      {/* Nagłówek: callsign + nazwa + licznik */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {isSelected && (
            <span className="text-[#a8cc30] text-xs" style={{ animation: 'bf-pulse 0.8s ease-in-out infinite' }}>▶</span>
          )}
          {isDeployed && <span className="text-[#4a6a20] text-xs">✓</span>}
          {!isSelected && !isDeployed && <span className="text-[#3a5018] text-xs">◇</span>}
          <span className={`text-xs font-bold tracking-wider ${isSelected ? 'text-[#c8f050]' : isDeployed ? 'text-[#4a6a20]' : 'text-[#7aaa30]'}`}>
            {callsign}
          </span>
          <span className={`text-xs ${isSelected ? 'text-[#8aaa40]' : 'text-[#3a5818]'}`}>
            {name}
          </span>
        </div>
        <span className={`text-xs tabular-nums ${isSelected ? 'text-[#a8cc30]' : 'text-[#3a5818]'}`}>
          {placed}/{total}
        </span>
      </div>

      {/* Wizualizacja statku — uproszczone pole z akcentem per typ */}
      <div className={`flex gap-0.5 ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
        {Array.from({ length: size }).map((_, i) => {
          const shipHull: Record<string, string> = {
            carrier: '#3a4e16', battleship: '#1a2a08', cruiser: '#304010', destroyer: '#3c5016',
          };
          const shipAccent: Record<string, string> = {
            carrier: '#88b825', battleship: '#4a7818', cruiser: '#70a020', destroyer: '#a8cc30',
          };
          const isFirstOrLast = i === 0 || i === size - 1;
          const cellStyle = isDeployed
            ? undefined
            : isSelected
              ? { backgroundColor: shipHull[type], borderColor: shipAccent[type] + (isFirstOrLast ? 'cc' : '88'), boxShadow: `inset 0 0 4px ${shipAccent[type]}22` }
              : { backgroundColor: shipHull[type] + 'bb', borderColor: shipAccent[type] + '44' };
          return (
          <div
            key={i}
            style={cellStyle}
            className={[
              'border transition-colors',
              orientation === 'vertical' ? 'w-4 h-3' : 'w-4 h-4',
              isDeployed ? 'bg-[#1a2a08] border-[#2a4010]' : '',
            ].join(' ')}
          />
          );
        })}
      </div>

      {/* Liczba pól */}
      <div className={`mt-1 text-[9px] tracking-widest ${isSelected ? 'text-[#6a8a28]' : 'text-[#2a3e10]'}`}>
        {size} GRID {size === 1 ? 'UNIT' : 'UNITS'} · {remaining > 0 ? `×${remaining} REMAINING` : 'DEPLOYED'}
      </div>
    </button>
  );
}

interface ShipPanelProps {
  selectedShip: ShipType | null;
  orientation: Orientation;
  phase: Phase;
  allShipsPlaced: boolean;
  remainingShips: (typeof SHIP_DEFINITIONS[number] & { placed: number; remaining: number })[];
  onSelectShip: (type: ShipType) => void;
  onToggleOrientation: () => void;
  onConfirmReady: () => void;
  onRandomize: () => void;
}

export default function ShipPanel({
  selectedShip, orientation, phase, allShipsPlaced,
  remainingShips,
  onSelectShip, onToggleOrientation, onConfirmReady, onRandomize,
}: ShipPanelProps) {
  const inBattle     = phase === 'battle';
  const deployedCount = remainingShips.reduce((s, d) => s + d.placed, 0);
  const totalCount    = remainingShips.reduce((s, d) => s + d.count, 0);
  const remaining     = totalCount - deployedCount;

  return (
    <div className="bf-hud flex flex-col gap-2 w-52">
      {/* Tytuł panelu */}
      <div className="flex items-center gap-2 pb-1 border-b border-[#2a3a18]">
        <div className="w-1.5 h-1.5 bg-[#a8cc30] rounded-full"
          style={{ animation: inBattle ? 'none' : 'bf-pulse 1.5s ease-in-out infinite' }} />
        <span className="text-[#a8cc30] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
          Fleet Deployment
        </span>
      </div>

      {/* Status */}
      <div className="flex justify-between items-center text-[9px] font-mono text-[#4a6a20] tracking-widest uppercase">
        <span>{inBattle ? '● BATTLE READY' : allShipsPlaced ? '◈ FLEET READY' : '○ DEPLOYING'}</span>
        <span>{deployedCount}/{totalCount}</span>
      </div>

      {/* Lista statków */}
      <div className="flex flex-col gap-1.5">
        {remainingShips.map(def => (
          <ShipItem
            key={def.type}
            type={def.type}
            name={def.name}
            callsign={def.callsign}
            size={def.size}
            remaining={def.remaining}
            placed={def.placed}
            total={def.count}
            isSelected={selectedShip === def.type}
            isDeployed={def.remaining === 0}
            orientation={orientation}
            onSelect={() => onSelectShip(def.type)}
          />
        ))}
      </div>

      {/* Przycisk OBRÓĆ — tylko gdy trwa rozstawianie i nie wszystko postawione */}
      {!inBattle && !allShipsPlaced && (
        <div className="mt-2">
          <button
            onClick={onToggleOrientation}
            className={[
              'w-full px-3 py-2.5 border-2 font-mono',
              'transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-[#a8cc30]',
              'border-[#6a9a20] bg-[#0f1a08]',
              'hover:border-[#a8cc30] hover:bg-[#182408]',
              'active:scale-[0.98]',
            ].join(' ')}
          >
            {/* Wiersz górny: ikona + napis + skrót */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#a8cc30] text-lg leading-none">↻</span>
                <span className="text-[#c8dc50] text-sm font-black tracking-[0.15em]">OBRÓĆ</span>
              </div>
              <span className="text-[#3a5818] text-[9px] border border-[#2a3a18] px-1.5 py-0.5 tracking-widest">
                R
              </span>
            </div>

            {/* Diagram: aktualna → następna orientacja */}
            <div className="flex items-center justify-center gap-3">
              {/* Aktualna orientacja — jasna */}
              <div className={`flex gap-0.5 ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-3 h-3 bg-[#3a5820] border border-[#7aaa30]" />
                ))}
              </div>

              <span className="text-[#4a6a20] text-xs">→</span>

              {/* Następna orientacja — ciemna */}
              <div className={`flex gap-0.5 ${orientation === 'vertical' ? 'flex-row' : 'flex-col'}`}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-3 h-3 bg-[#1e2e10] border border-[#3a5020]" />
                ))}
              </div>

              <span className="text-[#4a6a20] text-[9px] tracking-widest uppercase ml-1">
                {orientation === 'horizontal' ? '│ PIONOWO' : '─ POZIOMO'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── Przyciski akcji ── */}
      {!inBattle && (
        <div className="mt-1 flex flex-col gap-2">

          {/* GOTOWY — aktywny tylko gdy wszystkie statki postawione */}
          <button
            onClick={onConfirmReady}
            disabled={!allShipsPlaced}
            className={[
              'w-full py-3 px-3 border-2 font-mono font-black text-sm tracking-[0.2em]',
              'transition-all duration-150 focus:outline-none focus:ring-2',
              allShipsPlaced
                ? [
                    'border-[#a8cc30] bg-[#182808]',
                    'hover:bg-[#243e10] hover:border-[#c8f050]',
                    'active:scale-[0.98]',
                    'text-[#c8f050] focus:ring-[#a8cc30]',
                    'shadow-[0_0_16px_rgba(168,204,48,0.3)]',
                  ].join(' ')
                : [
                    'border-[#2a3a18] bg-[#0a0e06]',
                    'text-[#2a3e18] cursor-not-allowed',
                    'focus:ring-[#2a3a18]',
                  ].join(' '),
            ].join(' ')}
          >
            <div className="flex items-center justify-center gap-2">
              {allShipsPlaced
                ? <span style={{ animation: 'bf-pulse 0.9s ease-in-out infinite' }}>▶</span>
                : <span>▷</span>
              }
              <span>GOTOWY</span>
            </div>
            {!allShipsPlaced && (
              <div className="text-[9px] font-normal tracking-widest mt-0.5 text-[#2a3e18]">
                POZOSTAŁO: {remaining} {remaining === 1 ? 'JEDNOSTKA' : 'JEDNOSTKI'}
              </div>
            )}
          </button>

          {/* LOSOWE ROZMIESZCZENIE */}
          <button
            onClick={onRandomize}
            className={[
              'w-full py-2 px-3 border font-mono text-[10px] tracking-[0.15em]',
              'border-[#3a5a1a] bg-[#0a0e06] text-[#5a8a28]',
              'hover:border-[#6a9a20] hover:bg-[#0f1608] hover:text-[#8ab832]',
              'active:scale-[0.98] transition-all duration-100',
              'focus:outline-none focus:ring-1 focus:ring-[#6a9a20]',
            ].join(' ')}
          >
            <span className="mr-1.5">⚡</span>LOSOWE ROZMIESZCZENIE
          </button>

        </div>
      )}

      {/* Panel walki — widoczny po potwierdzeniu gotowości */}
      {inBattle && (
        <div className="mt-2 border border-[#4a8a20] bg-[#0a1206] p-3 text-center">
          <div className="text-[#a8cc30] text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
            ◈ BATTLE PHASE
          </div>
          <div className="text-[#4a6a20] text-[9px] font-mono tracking-wider">
            Click grid to fire
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-auto pt-3 border-t border-[#1a2a0e] flex flex-col gap-1">
        <div className="text-[9px] text-[#2a3e10] font-mono tracking-widest uppercase">Legend</div>
        <div className="flex items-center gap-2 text-[9px] text-[#3a5818] font-mono">
          <span className="w-3 h-3 inline-block" style={{ backgroundColor: 'rgba(100,180,30,0.55)', boxShadow: 'inset 0 0 5px rgba(160,230,50,0.4)' }} />
          placement OK
        </div>
        <div className="flex items-center gap-2 text-[9px] text-[#3a5818] font-mono">
          <span className="w-3 h-3 inline-block" style={{ backgroundColor: 'rgba(210,40,20,0.5)', boxShadow: 'inset 0 0 5px rgba(255,80,50,0.4)' }} />
          invalid position
        </div>
      </div>
    </div>
  );
}
