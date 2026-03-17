export interface GameSession {
  gameId: string;
  roomCode: string;
  playerId: string;
  playerName: string;
  playerSlot: 'player1' | 'player2';
}
