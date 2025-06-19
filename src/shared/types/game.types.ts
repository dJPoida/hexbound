// This file defines the structure of game-related objects
// shared between the client and server.

// A simplified User object for use within a Game context on the client
export interface Player {
  userId: string;
  userName: string;
}

// The structure for the status of a game
export interface GameStatus {
  statusId: number;
  statusName: 'waiting' | 'active' | 'finished';
}

// The main Game object structure as returned by the API
export interface Game {
  gameId: string;
  gameCode: string;
  currentTurn: number;
  status: GameStatus;
  players: Player[];
  currentPlayerId: string | null;
} 