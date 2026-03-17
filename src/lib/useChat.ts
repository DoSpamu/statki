import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  player_id: string;
  player_name: string;
  content: string;
  created_at: string;
}

export function useChat(gameId: string, playerId: string, playerName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Wczytaj historię
    supabase
      .from('messages')
      .select('id, player_id, player_name, content, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!data) return;
        data.forEach(m => knownIdsRef.current.add(m.id));
        setMessages(data as ChatMessage[]);
      });

    // Realtime — nowe wiadomości
    const ch = supabase
      .channel(`chat:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `game_id=eq.${gameId}` },
        payload => {
          const msg = payload.new as ChatMessage;
          if (knownIdsRef.current.has(msg.id)) return;
          knownIdsRef.current.add(msg.id);
          setMessages(prev => [...prev, msg]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [gameId]);

  async function sendMessage() {
    const content = inputValue.trim();
    if (!content || sending) return;
    setSending(true);
    setInputValue('');
    try {
      await supabase.from('messages').insert({
        game_id: gameId,
        player_id: playerId,
        player_name: playerName,
        content,
      });
    } finally {
      setSending(false);
    }
  }

  return { messages, inputValue, setInputValue, sendMessage, sending };
}
