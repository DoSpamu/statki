import { useState, useEffect, useRef } from 'react';
import { createGame, joinGame, getStoredPlayerName, savePlayerName } from '../lib/gameService';
import { supabase } from '../lib/supabase';
import SoundToggle from './SoundToggle';
import { playClick } from '../lib/soundEngine';
import type { GameSession } from '../types/lobby';

type LobbyState = 'idle' | 'creating' | 'waiting' | 'joining' | 'error';

interface LobbyScreenProps {
  onGameStart: (session: GameSession) => void;
  onAIStart: (playerName: string) => void;
}

function BlinkCursor() {
  return (
    <span
      className="inline-block w-2.5 h-4 bg-[#a8cc30] ml-0.5 align-middle"
      style={{ animation: 'bf-blink 1.1s step-start infinite' }}
    />
  );
}

// Pole wejściowe w stylu terminala
function TermInput({
  value, onChange, placeholder, maxLength, className = '', ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { value: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={[
        'bg-transparent border border-[#4a6a18] text-[#a8cc30] font-mono text-sm',
        'px-3 py-2 outline-none tracking-widest uppercase placeholder:text-[#2a4a10]',
        'focus:border-[#a8cc30] focus:shadow-[0_0_8px_#a8cc3044] transition-all duration-150',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}

export default function LobbyScreen({ onGameStart, onAIStart }: LobbyScreenProps) {
  const [playerName, setPlayerName] = useState(getStoredPlayerName);
  const [lobbyState, setLobbyState] = useState<LobbyState>('idle');
  const [session, setSession] = useState<GameSession | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Wyczyść subskrypcję Realtime przy odmontowaniu
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  function validateName(): boolean {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setErrorMsg('Wpisz pseudonim gracza.');
      return false;
    }
    savePlayerName(trimmed);
    return true;
  }

  async function handleCreate() {
    if (!validateName()) return;
    playClick();
    setLobbyState('creating');
    setErrorMsg('');
    try {
      const s = await createGame(playerName.trim());
      setSession(s);
      setLobbyState('waiting');
      subscribeToGame(s);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setLobbyState('error');
    }
  }

  async function handleJoin() {
    if (!validateName()) return;
    playClick();
    if (!joinCode.trim()) {
      setErrorMsg('Wpisz kod pokoju.');
      return;
    }
    setLobbyState('joining');
    setErrorMsg('');
    try {
      const s = await joinGame(joinCode, playerName.trim());
      onGameStart(s);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setLobbyState('error');
    }
  }

  // Subskrypcja Realtime — czekaj aż gracz 2 dołączy
  function subscribeToGame(s: GameSession) {
    const ch = supabase
      .channel(`lobby:${s.gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${s.gameId}` },
        (payload) => {
          const updated = payload.new as { player2_id: string | null; status: string };
          if (updated.player2_id) {
            supabase.removeChannel(ch);
            onGameStart(s);
          }
        },
      )
      .subscribe();
    channelRef.current = ch;
  }

  function handleAIStart() {
    if (!validateName()) return;
    playClick();
    onAIStart(playerName.trim());
  }

  const isWaiting = lobbyState === 'waiting';
  const isError  = lobbyState === 'error';
  const busy     = lobbyState === 'creating' || lobbyState === 'joining';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 font-mono"
      style={{ background: 'radial-gradient(ellipse at center, #0e1508 0%, #060905 100%)' }}
    >
      {/* Górny HUD */}
      <div className="w-full max-w-xl flex items-center justify-between text-[10px] text-[#4a6a18] tracking-widest uppercase border-b border-[#1e2e10] pb-2">
        <span>SYS: ONLINE</span>
        <span className="text-[#6a9a20]">◈ LOBBY ACTIVE</span>
        <SoundToggle />
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

      {/* Pole pseudonimu */}
      <div className="flex flex-col gap-2 w-full max-w-xl">
        <label className="text-[10px] text-[#6a9a20] tracking-[0.3em] uppercase">
          ◈ Pseudonim gracza
        </label>
        <TermInput
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          placeholder="KOMANDOR_X"
          maxLength={20}
          className="w-full"
          disabled={busy || isWaiting}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
        />
      </div>

      {/* Panel: VS KOMPUTER */}
      {!isWaiting && (
        <div className="w-full max-w-xl">
          <div className="flex flex-col gap-3 p-4 border border-[#4a6a18] bg-[#070b04] relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#a8cc30]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#a8cc30]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#a8cc30]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#a8cc30]" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#a8cc30] tracking-[0.3em] uppercase">
                ◉ Single Player — Gra z komputerem
              </span>
              <span className="text-[9px] text-[#4a6a18] tracking-widest">AI OPPONENT</span>
            </div>
            <p className="text-[10px] text-[#3a5818] tracking-wider leading-relaxed">
              Graj lokalnie przeciwko AI. Brak potrzeby połączenia z graczem.
            </p>
            <button
              onClick={handleAIStart}
              disabled={busy}
              className={[
                'px-4 py-2.5 text-xs font-black tracking-[0.3em] uppercase transition-all duration-150',
                'border focus:outline-none',
                busy
                  ? 'border-[#2a3a18] text-[#3a5818] cursor-not-allowed'
                  : 'border-[#a8cc30] text-[#a8cc30] hover:bg-[#a8cc3015] hover:shadow-[0_0_20px_#a8cc3055]',
              ].join(' ')}
            >
              ▶ VS KOMPUTER
            </button>
          </div>
        </div>
      )}

      {/* Linia podziału */}
      {!isWaiting && (
        <div className="flex items-center gap-4 w-full max-w-xl">
          <div className="flex-1 h-px bg-[#1e2e10]" />
          <span className="text-[9px] text-[#3a5818] tracking-[0.4em] uppercase">lub graj online</span>
          <div className="flex-1 h-px bg-[#1e2e10]" />
        </div>
      )}

      {/* Dwa panele akcji online */}
      {!isWaiting && (
        <div className="flex gap-6 w-full max-w-xl">
          {/* Panel: STWÓRZ GRĘ */}
          <div className="flex-1 flex flex-col gap-3 p-4 border border-[#2a3a18] bg-[#080c05] relative">
            {/* Narożniki */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#6a9a20]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#6a9a20]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#6a9a20]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#6a9a20]" />

            <span className="text-[10px] text-[#6a9a20] tracking-[0.3em] uppercase">
              ▸ Nowa gra
            </span>
            <p className="text-[10px] text-[#3a5818] tracking-wider leading-relaxed">
              Stwórz pokój i udostępnij kod przeciwnikowi.
            </p>
            <button
              onClick={handleCreate}
              disabled={busy}
              className={[
                'mt-auto px-4 py-2.5 text-xs font-black tracking-[0.3em] uppercase transition-all duration-150',
                'border focus:outline-none',
                busy
                  ? 'border-[#2a3a18] text-[#3a5818] cursor-not-allowed'
                  : 'border-[#a8cc30] text-[#a8cc30] hover:bg-[#a8cc3015] hover:shadow-[0_0_16px_#a8cc3044]',
              ].join(' ')}
            >
              {lobbyState === 'creating' ? (
                <span style={{ animation: 'bf-pulse 0.8s ease-in-out infinite' }}>
                  ◌ TWORZENIE…
                </span>
              ) : '▶ STWÓRZ GRĘ'}
            </button>
          </div>

          {/* Panel: DOŁĄCZ DO GRY */}
          <div className="flex-1 flex flex-col gap-3 p-4 border border-[#2a3a18] bg-[#080c05] relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#6a9a20]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#6a9a20]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#6a9a20]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#6a9a20]" />

            <span className="text-[10px] text-[#6a9a20] tracking-[0.3em] uppercase">
              ▸ Dołącz
            </span>
            <TermInput
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="KOD POKOJU"
              maxLength={6}
              className="w-full text-center"
              disabled={busy}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
            />
            <button
              onClick={handleJoin}
              disabled={busy}
              className={[
                'mt-auto px-4 py-2.5 text-xs font-black tracking-[0.3em] uppercase transition-all duration-150',
                'border focus:outline-none',
                busy
                  ? 'border-[#2a3a18] text-[#3a5818] cursor-not-allowed'
                  : 'border-[#6a9a20] text-[#6a9a20] hover:bg-[#6a9a2015] hover:shadow-[0_0_16px_#6a9a2033]',
              ].join(' ')}
            >
              {lobbyState === 'joining' ? (
                <span style={{ animation: 'bf-pulse 0.8s ease-in-out infinite' }}>
                  ◌ ŁĄCZENIE…
                </span>
              ) : '▶ DOŁĄCZ DO GRY'}
            </button>
          </div>
        </div>
      )}

      {/* Stan oczekiwania — po stworzeniu gry */}
      {isWaiting && session && (
        <div className="flex flex-col items-center gap-5 w-full max-w-xl">
          {/* Kod pokoju */}
          <div className="flex flex-col items-center gap-2 p-6 border border-[#a8cc3044] bg-[#080c05] w-full relative">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#a8cc30]" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#a8cc30]" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#a8cc30]" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#a8cc30]" />

            <span className="text-[10px] text-[#6a9a20] tracking-[0.35em] uppercase">
              Kod twojego pokoju
            </span>
            <span
              className="text-4xl font-black text-[#c8dc50] tracking-[0.5em] drop-shadow-[0_0_16px_#a8cc3066]"
            >
              {session.roomCode}
            </span>
            <span className="text-[10px] text-[#4a6a18] tracking-wider">
              Podaj ten kod przeciwnikowi
            </span>
          </div>

          {/* Pulsujący status oczekiwania */}
          <div
            className="text-xs text-[#6a9a20] tracking-[0.3em] uppercase"
            style={{ animation: 'bf-pulse 1.5s ease-in-out infinite' }}
          >
            ◌ Oczekiwanie na drugiego gracza…
          </div>

          {/* Anuluj */}
          <button
            onClick={() => {
              if (channelRef.current) supabase.removeChannel(channelRef.current);
              setLobbyState('idle');
              setSession(null);
            }}
            className="text-[10px] text-[#3a5818] hover:text-[#6a9a20] tracking-widest uppercase underline underline-offset-2 transition-colors"
          >
            Anuluj
          </button>
        </div>
      )}

      {/* Błąd */}
      {isError && errorMsg && (
        <div className="text-xs text-[#cc3010] tracking-wider border border-[#cc301033] px-4 py-2 bg-[#1e040008]">
          ✕ {errorMsg}
        </div>
      )}
      {/* Błąd walidacji (bez zmiany stanu na error) */}
      {!isError && errorMsg && (
        <div className="text-xs text-[#cc8010] tracking-wider">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Dolny HUD */}
      <div className="w-full max-w-xl flex items-center justify-between text-[10px] text-[#4a6a18] tracking-widest uppercase border-t border-[#1e2e10] pt-2">
        <span>PLAYER IDENTIFICATION REQUIRED</span>
        <span className="text-[#6a9a20]" style={{ animation: 'bf-pulse 2s ease-in-out infinite' }}>
          ● STANDBY
        </span>
      </div>
    </div>
  );
}
