import { useState, useEffect, useRef, useMemo } from 'react';
import Board from './Board';
import VictoryOverlay from './VictoryOverlay';
import { useBattleSync } from '../lib/useBattleSync';
import { SHIP_DEFINITIONS } from '../types/board';
import type { BoardGrid, CellShipInfo, PlacedShip } from '../types/board';
import type { GameSession } from '../types/lobby';

interface BattleViewProps {
  session: GameSession;
  myGrid: BoardGrid;
  myCellShipInfo: Map<string, CellShipInfo>;
  placedShips: PlacedShip[];
  applyIncomingShot: (row: number, col: number) => void;
  onReset: () => void;
}

// ─── Baner tury ───────────────────────────────────────────────────────────────
function TurnBanner({ isMyTurn, playerName }: { isMyTurn: boolean; playerName: string }) {
  return (
    <div className="w-full flex items-center justify-center gap-4 py-2">
      <div className="flex-1 h-px" style={{ background: isMyTurn ? '#a8cc3044' : '#2a3a18' }} />
      <div
        className="flex items-center gap-3 px-5 py-1.5 border font-mono text-xs tracking-[0.3em] uppercase"
        style={{
          borderColor: isMyTurn ? '#a8cc3066' : '#2a3a18',
          color: isMyTurn ? '#a8cc30' : '#4a6a18',
          animation: isMyTurn ? 'bf-pulse 1.5s ease-in-out infinite' : undefined,
        }}
      >
        {isMyTurn ? (
          <>
            <span className="text-[#c8dc50]">⊕</span>
            <span>TWOJA TURA — OTWÓRZ OGIEŃ</span>
          </>
        ) : (
          <>
            <span style={{ animation: 'bf-pulse 1s ease-in-out infinite' }}>◌</span>
            <span>{playerName.toUpperCase()} — OCZEKUJ NA SWOJĄ TURĘ</span>
          </>
        )}
      </div>
      <div className="flex-1 h-px" style={{ background: isMyTurn ? '#a8cc3044' : '#2a3a18' }} />
    </div>
  );
}

// ─── Etykieta planszy ─────────────────────────────────────────────────────────
function BoardLabel({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px" style={{ background: highlight ? '#a8cc3055' : '#2a3a18' }} />
      <span
        className="text-xs font-mono font-bold tracking-[0.25em] uppercase"
        style={{ color: highlight ? '#a8cc30' : '#4a6a18' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: highlight ? '#a8cc3055' : '#2a3a18' }} />
    </div>
  );
}

// ─── Licznik trafień ─────────────────────────────────────────────────────────
function HitCounter({ label, hits, total, color }: { label: string; hits: number; total: number; color: string }) {
  const pct = Math.round((hits / total) * 100);
  return (
    <div className="flex flex-col items-center gap-1 font-mono">
      <span className="text-[9px] tracking-widest uppercase" style={{ color: '#4a6a18' }}>{label}</span>
      <span className="text-lg font-black" style={{ color }}>
        {hits}<span className="text-xs font-normal text-[#3a5818]">/{total}</span>
      </span>
      {/* Pasek postępu */}
      <div className="w-20 h-1 bg-[#1e2e10] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Środkowy panel podziału ──────────────────────────────────────────────────
function Divider({ isMyTurn, myHits, theirHits, total }: {
  isMyTurn: boolean;
  myHits: number;
  theirHits: number;
  total: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-16 px-2 w-24">
      <HitCounter label="Moje" hits={myHits} total={total} color="#a8cc30" />
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-xl"
          style={{ color: isMyTurn ? '#c8dc50' : '#4a6a18' }}
        >
          {isMyTurn ? '⟶' : '⟵'}
        </span>
        <span className="text-[8px] tracking-widest uppercase" style={{ color: '#3a5818' }}>vs</span>
        <span
          className="text-xl"
          style={{ color: isMyTurn ? '#4a6a18' : '#c8dc50' }}
        >
          {isMyTurn ? '⟵' : '⟶'}
        </span>
      </div>
      <HitCounter label="Ich" hits={theirHits} total={total} color="#cc5522" />
    </div>
  );
}

// ─── Toast zatopienia ─────────────────────────────────────────────────────────
function SunkToast({ message, isEnemy }: { message: string; isEnemy: boolean }) {
  return (
    <div
      className="fixed top-6 left-1/2 z-40 font-mono text-sm font-bold tracking-[0.3em] uppercase px-6 py-3 pointer-events-none"
      style={{
        transform: 'translateX(-50%)',
        background: isEnemy ? 'rgba(10,30,5,0.92)' : 'rgba(30,5,5,0.92)',
        border: `1px solid ${isEnemy ? '#a8cc3066' : '#cc333366'}`,
        color: isEnemy ? '#a8cc30' : '#cc4444',
        boxShadow: isEnemy ? '0 0 20px #6a9a2044' : '0 0 20px #cc222244',
        animation: 'toast-slide 0.3s ease-out',
      }}
    >
      {isEnemy ? '⊕ ' : '✕ '}{message}
    </div>
  );
}

// ─── BattleView ───────────────────────────────────────────────────────────────
export default function BattleView({
  session, myGrid, myCellShipInfo, placedShips, applyIncomingShot, onReset,
}: BattleViewProps) {
  const {
    opponentGrid, isMyTurn, winner, isFiring,
    fireAtOpponent, sunkOpponentCells, sunkNotification,
    myShotCount, battleStartTime, myHits, theirHits,
  } = useBattleSync(session, applyIncomingShot);

  const TOTAL = 17; // 5+4+3+3+2

  // Wykrywanie zatopionych moich statków
  const mySunkIndicesRef = useRef<Set<number>>(new Set());
  const myToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [myToast, setMyToast] = useState<string | null>(null);

  useEffect(() => {
    placedShips.forEach((ship, idx) => {
      if (mySunkIndicesRef.current.has(idx)) return;
      const allHit = ship.cells.every(([r, c]) => myGrid[r][c].state === 'hit');
      if (!allHit) return;
      mySunkIndicesRef.current.add(idx);
      const def = SHIP_DEFINITIONS.find(d => d.type === ship.type);
      setMyToast(`Zatopiony! ${def?.name ?? ship.type}`);
      if (myToastTimerRef.current) clearTimeout(myToastTimerRef.current);
      myToastTimerRef.current = setTimeout(() => setMyToast(null), 3000);
    });
  }, [myGrid, placedShips]);

  // Komórki zatopionych moich statków
  const sunkMyCells = useMemo(() => {
    const cells = new Set<string>();
    placedShips.forEach(ship => {
      const allHit = ship.cells.every(([r, c]) => myGrid[r][c].state === 'hit');
      if (allHit) ship.cells.forEach(([r, c]) => cells.add(`${r},${c}`));
    });
    return cells;
  }, [myGrid, placedShips]);

  // Czas trwania gry
  const gameDurationMs = useMemo(
    () => (winner ? Date.now() - battleStartTime : 0),
    [winner, battleStartTime],
  );

  // Toast — priorytet: sunkNotification (mój strzał zatopił), myToast (mój statek zatopiony)
  const activeToast = sunkNotification ?? myToast;
  const isEnemyToast = !!sunkNotification;

  return (
    <>
      {winner && (
        <VictoryOverlay
          isWinner={winner === 'me'}
          onReset={onReset}
          stats={{ shots: myShotCount, durationMs: gameDurationMs }}
        />
      )}

      {activeToast && <SunkToast message={activeToast} isEnemy={isEnemyToast} />}

      <div className="flex flex-col items-center gap-2">
        {/* Baner tury */}
        <TurnBanner isMyTurn={isMyTurn} playerName={session.playerName} />

        <div className="flex items-start gap-0">
          {/* Moja plansza — widoczne statki, tylko do odczytu */}
          <div className="flex flex-col items-center gap-2">
            <BoardLabel>
              Moja flota — {session.playerName}
            </BoardLabel>
            <Board
              grid={myGrid}
              phase="battle"
              cellShipInfo={myCellShipInfo}
              previewCells={[]}
              previewValid={false}
              excludedCells={new Set()}
              onCellClick={() => {}}
              onCellHover={() => {}}
              onBoardLeave={() => {}}
              sunkCells={sunkMyCells}
              readonly
            />
          </div>

          {/* Środkowy divider ze statystykami */}
          <Divider
            isMyTurn={isMyTurn}
            myHits={myHits}
            theirHits={theirHits}
            total={TOTAL}
          />

          {/* Plansza przeciwnika — statki ukryte, klikalna gdy moja tura */}
          <div className="flex flex-col items-center gap-2">
            <BoardLabel highlight={isMyTurn}>
              {isMyTurn ? '⊕ Flota wroga — CELUJ' : 'Flota wroga'}
            </BoardLabel>
            <Board
              grid={opponentGrid}
              phase="battle"
              cellShipInfo={new Map()}
              previewCells={[]}
              previewValid={false}
              excludedCells={new Set()}
              onCellClick={(r, c) => {
                if (isMyTurn && !isFiring && opponentGrid[r][c].state === 'empty')
                  fireAtOpponent(r, c);
              }}
              onCellHover={() => {}}
              onBoardLeave={() => {}}
              sunkCells={sunkOpponentCells}
              readonly={!isMyTurn || isFiring}
            />
          </div>
        </div>

        {/* Legenda stanu pól */}
        <div className="flex gap-5 text-[9px] font-mono tracking-widest uppercase text-[#3a5818] mt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-[#141d0c] border border-[#2a3a18]" />
            nieznany
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-[#1e0400]" style={{ boxShadow: 'inset 0 0 5px #ff220018' }} />
            trafiony
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-[#2a0000]" style={{ boxShadow: 'inset 0 0 5px #cc000033' }} />
            zatopiony
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-[#0d1e26]" style={{ boxShadow: 'inset 0 0 5px #1a5577aa' }} />
            chybienie
          </span>
        </div>
      </div>
    </>
  );
}
