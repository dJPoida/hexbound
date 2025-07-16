// Server -> Client: Game state payload

import { Player } from '../../../core/player.type';

// The game state payload that is sent to the client.
// It omits server-only fields like the turn action log and map data.
export interface ClientGameStatePayload {
  gameId: string;
  gameCode: string;
  turnNumber: number;
  currentPlayerId: string;
  players: Player[];
  gameState: {
    placeholderCounter: number;
  };
} 