import type { Phase, Orientation } from '../types/board';

// Pojedynczy klawisz w stylu BF HUD
function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 border border-[#5a8a20] bg-[#0f1a08] text-[#a8cc30] text-[10px] font-mono font-bold tracking-wide">
      {children}
    </span>
  );
}

// Wiersz skrótu: klawisze + opis
function ShortcutRow({
  keys,
  description,
  active = true,
}: {
  keys: React.ReactNode[];
  description: string;
  active?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${active ? '' : 'opacity-30'}`}>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[#2a4010] text-[9px]">/</span>}
            <Key>{k}</Key>
          </span>
        ))}
      </div>
      <span className="text-[#4a6a20] text-[9px] font-mono tracking-wider uppercase">
        {description}
      </span>
    </div>
  );
}

interface KeyboardLegendProps {
  phase: Phase;
  orientation: Orientation;
}

export default function KeyboardLegend({ phase, orientation }: KeyboardLegendProps) {
  const inPlacement = phase === 'placement';

  return (
    <div className="flex flex-col gap-3 w-44">

      {/* Nagłówek */}
      <div className="flex items-center gap-2 pb-1 border-b border-[#2a3a18]">
        <span className="text-[#3a5818] text-xs">⌨</span>
        <span className="text-[#6a9a20] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
          Skróty
        </span>
      </div>

      {/* ── Obrót statku ── */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[9px] text-[#3a5010] font-mono tracking-[0.2em] uppercase mb-0.5">
          Obrót statku
        </div>

        <ShortcutRow
          keys={['R']}
          description="obróć statek"
          active={inPlacement}
        />

        {/* Wizualizacja aktualnej orientacji */}
        {inPlacement && (
          <div className="flex items-center gap-3 mt-1 pl-1">
            <div className={`flex gap-0.5 ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-[#2a4018] border border-[#4a7028]" />
              ))}
            </div>
            <span className="text-[#3a5818] text-[9px] font-mono tracking-widest">
              {orientation === 'horizontal' ? '─ POZIOMO' : '│ PIONOWO'}
            </span>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="h-px bg-[#1a2a0e]" />

      {/* ── Pozostałe skróty ── */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[9px] text-[#3a5010] font-mono tracking-[0.2em] uppercase mb-0.5">
          Nawigacja
        </div>

        <ShortcutRow
          keys={['↑', '↓', '←', '→']}
          description="kursorem po siatce"
          active={false}
        />

        <ShortcutRow
          keys={['Enter', 'Space']}
          description="potwierdź akcję"
          active={false}
        />
      </div>

      {/* Separator */}
      <div className="h-px bg-[#1a2a0e]" />

      {/* ── Faza ── */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[9px] text-[#3a5010] font-mono tracking-[0.2em] uppercase mb-0.5">
          Faza gry
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${inPlacement ? 'bg-[#a8cc30]' : 'bg-[#2a4010]'}`}
            style={inPlacement ? { animation: 'bf-pulse 1.5s ease-in-out infinite' } : undefined}
          />
          <span className={`text-[9px] font-mono tracking-wider uppercase ${inPlacement ? 'text-[#7aaa30]' : 'text-[#2a4010]'}`}>
            Rozstawianie
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${!inPlacement ? 'bg-[#c8dc50]' : 'bg-[#2a4010]'}`}
            style={!inPlacement ? { animation: 'bf-pulse 1.5s ease-in-out infinite' } : undefined}
          />
          <span className={`text-[9px] font-mono tracking-wider uppercase ${!inPlacement ? 'text-[#a8cc30]' : 'text-[#2a4010]'}`}>
            Walka
          </span>
        </div>
      </div>

    </div>
  );
}
