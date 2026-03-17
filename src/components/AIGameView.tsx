import { useEffect, useRef } from 'react';
import Board from './Board';
import ShipPanel from './ShipPanel';
import KeyboardLegend from './KeyboardLegend';
import AIBattleView from './AIBattleView';
import SoundToggle from './SoundToggle';
import { useBoardStore } from '../store/boardStore';
import { playPlaceShip, playReady, playRandomize, playClick } from '../lib/soundEngine';

interface AIGameViewProps {
  playerName: string;
  onReturnToLobby: () => void;
}

export default function AIGameView({ playerName, onReturnToLobby }: AIGameViewProps) {
  const {
    grid, phase,
    selectedShip, orientation,
    previewCells, previewValid,
    excludedCells, cellShipInfo,
    remainingShips, allShipsPlaced,
    placedShips,
    selectShip, toggleOrientation,
    forceBattlePhase, applyIncomingShot, randomizePlacement,
    handleCellClick, handleCellHover, handleBoardLeave,
    resetGame,
  } = useBoardStore();

  // Dźwięk przy postawieniu statku
  const prevPlacedCountRef = useRef(0);
  useEffect(() => {
    if (placedShips.length > prevPlacedCountRef.current) playPlaceShip();
    prevPlacedCountRef.current = placedShips.length;
  }, [placedShips.length]);

  function handleConfirmReady() {
    if (allShipsPlaced) { playReady(); forceBattlePhase(); }
  }

  function handleReset() {
    resetGame();
    onReturnToLobby();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 font-mono"
      style={{ background: 'radial-gradient(ellipse at center, #0e1508 0%, #060905 100%)' }}
    >
      {/* Górny HUD */}
      <div className="w-full max-w-max flex items-center justify-between gap-12 text-[10px] text-[#4a6a18] tracking-widest uppercase border-b border-[#1e2e10] pb-2">
        <span>SYS: ONLINE</span>
        <span className="text-[#6a9a20]">◈ MODE: <span className="text-[#a8cc30] font-black">VS KOMPUTER</span></span>
        <span
          className="text-[#a8cc30]"
          style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}
        >
          ◉ AI ACTIVE
        </span>
        <SoundToggle />
      </div>

      {/* Tytuł */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-end gap-0 leading-none">
          <span className="text-6xl font-black text-[#c8dc50] tracking-tight uppercase drop-shadow-[0_0_20px_#6a9a2088]">
            STAT
          </span>
          <span className="text-6xl font-black text-[#e8eee0] tracking-tight uppercase">KI</span>
          <span
            className="inline-block w-3 h-5 bg-[#a8cc30] ml-1 align-middle"
            style={{ animation: 'bf-blink 1.1s step-start infinite' }}
          />
        </div>
        <span className="text-[10px] text-[#4a6a18] tracking-[0.35em] uppercase">
          Naval Combat System — Single Player
        </span>
      </div>

      {/* ── Faza rozstawiania ── */}
      {phase === 'placement' && (
        <div className="flex items-start gap-8">
          <ShipPanel
            selectedShip={selectedShip}
            orientation={orientation}
            phase={phase}
            allShipsPlaced={allShipsPlaced}
            remainingShips={remainingShips}
            onSelectShip={selectShip}
            onToggleOrientation={toggleOrientation}
            onConfirmReady={handleConfirmReady}
            onRandomize={() => { playRandomize(); randomizePlacement(); }}
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className="text-[10px] font-mono tracking-widest uppercase"
              style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}
            >
              {selectedShip
                ? <span className="text-[#a8cc30]">▶ SELECT GRID POSITION — CLICK TO DEPLOY</span>
                : <span className="text-[#6a9a20]">◈ SELECT UNIT FROM PANEL</span>
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
            />

            <div className="flex gap-5 text-[9px] font-mono tracking-widest uppercase text-[#3a5818]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-[#141d0c] border border-[#2a3a18]" />sektor wolny
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-[#263315] border border-[#1e2a0a]" />jednostka
              </span>
            </div>
          </div>

          <KeyboardLegend phase={phase} orientation={orientation} />
        </div>
      )}

      {/* ── Faza walki ── */}
      {phase === 'battle' && (
        <AIBattleView
          playerName={playerName}
          myGrid={grid}
          myCellShipInfo={cellShipInfo}
          placedShips={placedShips}
          applyIncomingShot={applyIncomingShot}
          onReset={handleReset}
        />
      )}

      {/* Dolny HUD */}
      <div className="w-full max-w-max flex items-center justify-between gap-12 text-[10px] text-[#4a6a18] tracking-widest uppercase border-t border-[#1e2e10] pt-2">
        <span className="text-[#6a9a20]">
          P1 · <span className="text-[#a8cc30]">{playerName.toUpperCase()}</span>
        </span>
        <span className="text-[#6a9a20]" style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}>
          ● {phase === 'placement' ? 'DEPLOYING FLEET' : 'BATTLE ACTIVE'}
        </span>
        <button
          onClick={() => { playClick(); onReturnToLobby(); }}
          className="text-[#3a5818] hover:text-[#6a9a20] tracking-widest uppercase transition-colors"
        >
          ← LOBBY
        </button>
      </div>
    </div>
  );
}
