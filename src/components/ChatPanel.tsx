import { useEffect, useRef } from 'react';
import { useChat } from '../lib/useChat';

interface ChatPanelProps {
  gameId: string;
  playerId: string;
  playerName: string;
}

export default function ChatPanel({ gameId, playerId, playerName }: ChatPanelProps) {
  const { messages, inputValue, setInputValue, sendMessage } = useChat(gameId, playerId, playerName);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do ostatniej wiadomości
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); void sendMessage(); }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div className="w-full flex flex-col border border-[#1e2e10] bg-[#060905] font-mono"
      style={{ maxHeight: 200 }}>

      {/* Nagłówek */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#1e2e10]">
        <div className="flex-1 h-px bg-[#1e2e10]" />
        <span className="text-[9px] text-[#4a6a18] tracking-[0.35em] uppercase">◈ COMMS CHANNEL</span>
        <div className="flex-1 h-px bg-[#1e2e10]" />
      </div>

      {/* Lista wiadomości */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1" style={{ minHeight: 110, maxHeight: 140 }}>
        {messages.length === 0 && (
          <span className="text-[9px] text-[#2a3a18] tracking-wider italic">Brak wiadomości…</span>
        )}
        {messages.map(msg => {
          const isMe = msg.player_id === playerId;
          return (
            <div key={msg.id} className={`flex gap-2 items-baseline ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <span className="text-[9px] font-bold tracking-wider shrink-0"
                  style={{ color: '#cc8833' }}>
                  {msg.player_name.toUpperCase()}
                </span>
              )}
              <span className="text-[10px] tracking-wide px-2 py-0.5 max-w-[60%] break-words"
                style={{
                  color: isMe ? '#a8cc30' : '#e8d8a0',
                  background: isMe ? '#0a1a04' : '#1a1000',
                  border: `1px solid ${isMe ? '#2a4a10' : '#3a2a00'}`,
                }}>
                {msg.content}
              </span>
              {isMe && (
                <span className="text-[9px] font-bold tracking-wider shrink-0"
                  style={{ color: '#6a9a20' }}>
                  TY
                </span>
              )}
              <span className="text-[8px] text-[#2a3a18] shrink-0">{formatTime(msg.created_at)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[#1e2e10]">
        <span className="text-[#4a6a18] text-[10px] shrink-0">▶</span>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          placeholder="Wyślij wiadomość… (Enter)"
          className="flex-1 bg-transparent text-[#a8cc30] text-[10px] tracking-wider outline-none placeholder:text-[#2a3a18]"
        />
        <button
          onClick={() => void sendMessage()}
          disabled={!inputValue.trim()}
          className="text-[9px] tracking-[0.3em] uppercase transition-colors focus:outline-none"
          style={{ color: inputValue.trim() ? '#6a9a20' : '#2a3a18' }}
        >
          WYŚLIJ
        </button>
      </div>
    </div>
  );
}
