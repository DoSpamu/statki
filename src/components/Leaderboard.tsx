import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getOrCreatePlayerId } from '../lib/gameService';

interface GameRecord {
  id: string;
  room_code: string;
  player1_name: string;
  player2_name: string | null;
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  created_at: string;
}

function winnerName(g: GameRecord): string {
  if (!g.winner_id) return '?';
  if (g.winner_id === g.player1_id) return g.player1_name;
  if (g.winner_id === g.player2_id) return g.player2_name ?? '?';
  return '?';
}

function loserName(g: GameRecord): string {
  if (!g.winner_id) return '?';
  if (g.winner_id !== g.player1_id) return g.player1_name;
  return g.player2_name ?? '?';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function Leaderboard() {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const myId = getOrCreatePlayerId();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('games')
      .select('id, room_code, player1_name, player2_name, player1_id, player2_id, winner_id, created_at')
      .eq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(15);
    setRecords((data as GameRecord[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();

    // Realtime — odświeżaj gdy ktoś skończy grę
    const ch = supabase
      .channel('leaderboard_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games' },
        payload => {
          const g = payload.new as { status: string };
          if (g.status === 'finished') void load();
        })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Statystyki gracza
  const myGames   = records.filter(g => g.player1_id === myId || g.player2_id === myId);
  const myWins    = myGames.filter(g => g.winner_id === myId).length;
  const myLosses  = myGames.filter(g => g.winner_id && g.winner_id !== myId).length;

  if (loading) return (
    <div className="w-full max-w-xl text-[10px] text-[#4a6a18] tracking-widest uppercase text-center"
      style={{ animation: 'bf-pulse 1s ease-in-out infinite' }}>
      ◌ Ładowanie tablicy wyników…
    </div>
  );

  if (records.length === 0) return (
    <div className="w-full max-w-xl text-center">
      <span className="text-[9px] text-[#2a3a18] tracking-[0.4em] uppercase">
        Brak rozegranych bitew — bądź pierwszy!
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-xl flex flex-col gap-3 font-mono">

      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1e2e10]" />
        <span className="text-[10px] text-[#6a9a20] tracking-[0.4em] uppercase">◈ Tablica wyników</span>
        <div className="flex-1 h-px bg-[#1e2e10]" />
      </div>

      {/* Statystyki gracza (jeśli grał) */}
      {(myWins > 0 || myLosses > 0) && (
        <div className="flex items-center justify-center gap-8 py-2 border border-[#2a3a18] bg-[#070b04] relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#6a9a20]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#6a9a20]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#6a9a20]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#6a9a20]" />
          <span className="text-[9px] text-[#4a6a18] tracking-widest uppercase">Moje statystyki</span>
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-black text-[#a8cc30]">{myWins}</span>
              <span className="text-[8px] text-[#4a6a18] tracking-widest uppercase">Zwycięstwa</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-black text-[#cc4422]">{myLosses}</span>
              <span className="text-[8px] text-[#4a6a18] tracking-widest uppercase">Porażki</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-black text-[#6a9a20]">
                {myWins + myLosses > 0 ? Math.round((myWins / (myWins + myLosses)) * 100) : 0}%
              </span>
              <span className="text-[8px] text-[#4a6a18] tracking-widest uppercase">Win rate</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista ostatnich bitew */}
      <div className="flex flex-col border border-[#1e2e10] overflow-hidden">
        {/* Nagłówek tabeli */}
        <div className="grid text-[8px] text-[#3a5818] tracking-[0.3em] uppercase px-3 py-1.5 border-b border-[#1e2e10] bg-[#060905]"
          style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
          <span>Zwycięzca</span>
          <span>Pokonany</span>
          <span>Pokój</span>
          <span>Data</span>
        </div>

        {records.map((g, i) => {
          const isMyWin  = g.winner_id === myId;
          const isMyLoss = !isMyWin && (g.player1_id === myId || g.player2_id === myId);
          return (
            <div
              key={g.id}
              className="grid items-center px-3 py-1.5 text-[10px] border-b border-[#0e1508] last:border-0"
              style={{
                gridTemplateColumns: '1fr 1fr 1fr auto',
                background: isMyWin ? '#070f03' : isMyLoss ? '#0f0703' : (i % 2 === 0 ? '#060905' : '#070a04'),
              }}
            >
              <span className="font-bold tracking-wider truncate"
                style={{ color: isMyWin ? '#a8cc30' : '#6a9a20' }}>
                ▲ {winnerName(g).toUpperCase()}
              </span>
              <span className="tracking-wider truncate text-[#4a6a18]">
                {loserName(g).toUpperCase()}
              </span>
              <span className="tracking-widest text-[#3a5818]">{g.room_code}</span>
              <span className="text-[8px] text-[#2a3a18] tracking-wider whitespace-nowrap">
                {formatDate(g.created_at)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Odśwież */}
      <button
        onClick={() => void load()}
        className="self-end text-[8px] text-[#2a3a18] hover:text-[#4a6a18] tracking-[0.4em] uppercase transition-colors"
      >
        ↺ Odśwież
      </button>
    </div>
  );
}
