import Board from './components/Board';
import { useBoardStore } from './store/boardStore';

export default function App() {
  const { grid, handleCellClick } = useBoardStore();

  return (
    <div className="min-h-screen bg-[#0e0b07] flex flex-col items-center justify-center gap-8 p-8">
      {/* Tytuł w stylu czołówki Breaking Bad */}
      <h1 className="text-5xl font-black tracking-tight">
        <span className="text-[#e8b84b]">STAT</span>
        <span className="text-[#4a9ab5]">KI</span>
      </h1>

      <Board
        grid={grid}
        onCellClick={handleCellClick}
        title="Plansza (tryb testowy)"
      />

      {/* Legenda kolorów */}
      <div className="flex gap-6 text-xs font-semibold tracking-wide">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[#1a3d52] border-2 border-[#0e2233] inline-block" />
          <span className="text-[#7aafcc]">puste</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[#3b4a1c] border-2 border-[#1e2a0a] inline-block" />
          <span className="text-[#8fa84a]">statek</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[#7a1e00] border-2 border-[#3d0e00] inline-block" />
          <span className="text-[#d45a2a]">trafiony</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[#c4a46b] border-2 border-[#8a6e3a] inline-block" />
          <span className="text-[#c4a46b]">pudło</span>
        </span>
      </div>
    </div>
  );
}
