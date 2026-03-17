import Board from './Board';
import VictoryOverlay from './VictoryOverlay';
import { useBattleSync } from '../lib/useBattleSync';
import type { BoardGrid, CellShipInfo } from '../types/board';
import type { GameSession } from '../types/lobby';

interface BattleViewProps {
  session: GameSession;
  myGrid: BoardGrid;
  myCellShipInfo: Map<string, CellShipInfo>;
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

// ─── BattleView ───────────────────────────────────────────────────────────────
export default function BattleView({
  session, myGrid, myCellShipInfo, applyIncomingShot, onReset,
}: BattleViewProps) {
  const {
    opponentGrid, isMyTurn, winner, isFiring,
    fireAtOpponent,
  } = useBattleSync(session, applyIncomingShot);

  const TOTAL = 17; // 5+4+3+3+2

  // Liczniki trafień wyliczone z siatek
  const myHits   = opponentGrid.flat().filter(c => c.state === 'hit').length;
  const theirHits = myGrid.flat().filter(c => c.state === 'hit').length;

  return (
    <>
      {winner && (
        <VictoryOverlay isWinner={winner === 'me'} onReset={onReset} />
      )}

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
            <span className="w-2.5 h-2.5 inline-block bg-[#0d1e26]" style={{ boxShadow: 'inset 0 0 5px #1a5577aa' }} />
            chybienie
          </span>
        </div>
      </div>
    </>
  );
}
