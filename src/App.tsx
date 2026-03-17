import Board from './components/Board';
import ShipPanel from './components/ShipPanel';
import KeyboardLegend from './components/KeyboardLegend';
import VictoryOverlay from './components/VictoryOverlay';
import { useBoardStore } from './store/boardStore';
import { useSupabaseStatus } from './lib/useSupabaseStatus';

function BlinkCursor() {
  return (
    <span
      className="inline-block w-3 h-5 bg-[#a8cc30] ml-1 align-middle"
      style={{ animation: 'bf-blink 1.1s step-start infinite' }}
    />
  );
}

export default function App() {
  const { status, gamesCount, errorMessage } = useSupabaseStatus();
  const {
    grid, phase, winner,
    selectedShip, orientation,
    previewCells, previewValid,
    excludedCells, cellShipInfo,
    remainingShips, allShipsPlaced,
    selectShip, toggleOrientation,
    confirmReady, randomizePlacement,
    handleCellClick, handleCellHover, handleBoardLeave,
    resetGame,
  } = useBoardStore();

  return (
    <>
    {winner && <VictoryOverlay onReset={resetGame} />}
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 font-mono"
      style={{ background: 'radial-gradient(ellipse at center, #0e1508 0%, #060905 100%)' }}
    >
      {/* Górny HUD */}
      <div className="w-full max-w-max flex items-center justify-between gap-12 text-[10px] text-[#4a6a18] tracking-widest uppercase border-b border-[#1e2e10] pb-2">
        <span>SYS: ONLINE</span>
        <span className="text-[#6a9a20]">◈ GRID ACTIVE</span>
        {/* Wskaźnik połączenia z Supabase */}
        {status === 'checking' && (
          <span className="text-[#4a6a18]" style={{ animation: 'bf-pulse 1s ease-in-out infinite' }}>
            ◌ DB CONNECTING…
          </span>
        )}
        {status === 'online' && (
          <span className="text-[#a8cc30]">
            ● DB ONLINE · GAMES: {gamesCount}
          </span>
        )}
        {status === 'error' && (
          <span className="text-[#cc3010]" title={errorMessage ?? ''}>
            ✕ DB ERROR
          </span>
        )}
      </div>

      {/* Tytuł */}
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
        <span className="text-[10px] text-[#4a6a18] tracking-[0.35em] uppercase">
          Naval Combat System — Tactical Grid v1.0
        </span>
      </div>

      {/* Główny układ: panel boczny + plansza + legenda skrótów */}
      <div className="flex items-start gap-8">
        <ShipPanel
          selectedShip={selectedShip}
          orientation={orientation}
          phase={phase}
          allShipsPlaced={allShipsPlaced}
          remainingShips={remainingShips}
          onSelectShip={selectShip}
          onToggleOrientation={toggleOrientation}
          onConfirmReady={confirmReady}
          onRandomize={randomizePlacement}
        />

        <div className="flex flex-col items-center gap-3">
          {/* Instrukcja kontekstowa */}
          <div className="text-[10px] font-mono tracking-widest uppercase" style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}>
            {phase === 'placement'
              ? selectedShip
                ? <span className="text-[#a8cc30]">▶ SELECT GRID POSITION — CLICK TO DEPLOY</span>
                : <span className="text-[#6a9a20]">◈ SELECT UNIT FROM PANEL</span>
              : <span className="text-[#c8dc50]">⊕ BATTLE PHASE — CLICK TO FIRE</span>
            }
          </div>

          <Board
            grid={grid}
            phase={phase}
            cellShipInfo={cellShipInfo}
            previewCells={previewCells}
            previewValid={previewValid}
            excludedCells={excludedCells}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            onBoardLeave={handleBoardLeave}
            title="Tactical Grid — Sector Alpha"
            exploding={!!winner}
          />

          {/* Legenda dolna */}
          <div className="flex gap-5 text-[9px] font-mono tracking-widest uppercase text-[#3a5818]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#141d0c] border border-[#2a3a18]" />sektor wolny
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#263315] border border-[#1e2a0a]" />jednostka
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#1e0400]" style={{ boxShadow: 'inset 0 0 5px #ff220018' }} />trafiony
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#0d1e26]" style={{ boxShadow: 'inset 0 0 5px #1a5577aa' }} />chybienie
            </span>
          </div>
        </div>

        {/* Legenda skrótów klawiszowych — prawa strona */}
        <KeyboardLegend phase={phase} orientation={orientation} />
      </div>

      {/* Dolny HUD */}
      <div className="w-full max-w-max flex items-center justify-between gap-12 text-[10px] text-[#4a6a18] tracking-widest uppercase border-t border-[#1e2e10] pt-2">
        <span>PLAYER 1</span>
        <span className="text-[#6a9a20]" style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}>
          ● {phase === 'placement' ? 'DEPLOYING FLEET' : 'TARGETING'}
        </span>
        <span>AWAITING INPUT</span>
      </div>
    </div>
    </>
  );
}
