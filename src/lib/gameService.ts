import { supabase } from './supabase';
import type { GameSession } from '../types/lobby';

// Znaki bez dwuznacznych (bez 0/O, 1/I/L)
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  return Array.from(
    { length: 6 },
    () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)],
  ).join('');
}

// Pobierz lub utwórz trwałe ID gracza (UUID przeglądarki, nie wymaga auth)
export function getOrCreatePlayerId(): string {
  const key = 'statki_player_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export function getStoredPlayerName(): string {
  return sessionStorage.getItem('statki_player_name') ?? '';
}

export function savePlayerName(name: string): void {
  sessionStorage.setItem('statki_player_name', name);
}

// Stwórz nową grę — zwraca sesję z kodem pokoju
export async function createGame(playerName: string): Promise<GameSession> {
  const playerId = getOrCreatePlayerId();
  const roomCode = generateRoomCode();

  const { data, error } = await supabase
    .from('games')
    .insert({
      room_code: roomCode,
      player1_id: playerId,
      player1_name: playerName,
      status: 'waiting',
    })
    .select('id, room_code')
    .single();

  if (error) throw new Error(error.message);

  return {
    gameId: data.id,
    roomCode: data.room_code,
    playerId,
    playerName,
    playerSlot: 'player1',
  };
}

// Dołącz do istniejącej gry przez kod pokoju
export async function joinGame(roomCode: string, playerName: string): Promise<GameSession> {
  const playerId = getOrCreatePlayerId();
  const code = roomCode.trim().toUpperCase();

  // Znajdź grę z tym kodem (status: waiting)
  const { data: game, error: findError } = await supabase
    .from('games')
    .select('id, room_code, player1_id')
    .eq('room_code', code)
    .eq('status', 'waiting')
    .single();

  if (findError || !game) {
    throw new Error('Nie znaleziono gry o podanym kodzie lub gra już się rozpoczęła.');
  }

  if (game.player1_id === playerId) {
    throw new Error('Nie możesz dołączyć do własnej gry.');
  }

  // Zapisz gracza 2 i zmień status na placement
  const { error: updateError } = await supabase
    .from('games')
    .update({ player2_id: playerId, player2_name: playerName, status: 'placement' })
    .eq('id', game.id);

  if (updateError) throw new Error(updateError.message);

  return {
    gameId: game.id,
    roomCode: game.room_code,
    playerId,
    playerName,
    playerSlot: 'player2',
  };
}
