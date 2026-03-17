import Board from './components/Board';
import { useBoardStore } from './store/boardStore';

// Kursor migający — efekt terminala wojskowego
function BlinkCursor() {
  return (
    <span
      className="inline-block w-3 h-5 bg-[#a8cc30] ml-1 align-middle"
      style={{ animation: 'bf-blink 1.1s step-start infinite' }}
    />
  );
}

export default function App() {
  const { grid, handleCellClick } = useBoardStore();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 font-mono"
      style={{ background: 'radial-gradient(ellipse at center, #0e1508 0%, #060905 100%)' }}
    >
      {/* Pasek statusu – górny HUD */}
      <div className="w-full max-w-max flex items-center justify-between gap-8 text-[10px] text-[#4a6a18] tracking-widest uppercase border-b border-[#1e2e10] pb-2">
        <span>SYS: ONLINE</span>
        <span className="text-[#6a9a20]">◈ GRID ACTIVE</span>
        <span>SECURE CHANNEL</span>
      </div>

      {/* Tytuł w stylu BF */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-end gap-0 leading-none">
          <span className="text-6xl font-black text-[#c8dc50] tracking-tight uppercase drop-shadow-[0_0_20px_#6a9a2088]">
            STAT
          </span>
          <span className="text-6xl font-black text-[#e8eee0] tracking-tight uppercase">
            KI
          </span>
          <BlinkCursor />
        </div>
        <span className="text-[10px] text-[#4a6a18] tracking-[0.35em] uppercase font-mono">
          Naval Combat System — Tactical Grid v1.0
        </span>
      </div>

      {/* Plansza */}
      <Board
        grid={grid}
        onCellClick={handleCellClick}
        title="Tactical Grid — Sector Alpha"
      />

      {/* Legenda */}
      <div className="flex gap-6 text-[10px] font-mono tracking-widest uppercase text-[#4a6a18]">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 inline-block border border-[#2a3a18] bg-[#141d0c]" />
          sektor wolny
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 inline-block border border-[#1e2a0a] bg-[#263315]" />
          jednostka
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 inline-block bg-[#1e0400]" style={{ boxShadow: 'inset 0 0 6px #ff220018' }} />
          trafiony
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 inline-block bg-[#0d1e26]" style={{ boxShadow: 'inset 0 0 6px #1a5577aa' }} />
          chybienie
        </span>
      </div>

      {/* Pasek statusu – dolny HUD */}
      <div className="w-full max-w-max flex items-center justify-between gap-8 text-[10px] text-[#4a6a18] tracking-widest uppercase border-t border-[#1e2e10] pt-2">
        <span>AWAITING INPUT</span>
        <span className="text-[#6a9a20]" style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}>
          ● TARGETING
        </span>
        <span>PLAYER 1</span>
      </div>
    </div>
  );
}
