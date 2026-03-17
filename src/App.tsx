import Board from './components/Board';
import { useBoardStore } from './store/boardStore';

export default function App() {
  const { grid, handleCellClick } = useBoardStore();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-white text-4xl font-bold tracking-tight">
        Statki – Multiplayer
      </h1>

      <Board
        grid={grid}
        onCellClick={handleCellClick}
        title="Plansza (tryb testowy)"
      />

      <p className="text-blue-300 text-sm">
        Kliknij pole aby strzelić. Szare = statek, niebieski = puste.
      </p>
    </div>
  );
}
