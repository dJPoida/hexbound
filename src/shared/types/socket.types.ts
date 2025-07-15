import { WebSocket } from 'ws';

import { MapData, Player } from './game.types';

// Extend the WebSocket type to include user information
export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

// A generic structure for all messages sent over WebSocket
export interface SocketMessage<T> {
  type: string;
  payload: T;
}

// --- Client -> Server Message Payloads ---

export interface GameSubscribePayload {
  gameId: string;
}

export interface GameUnsubscribePayload {
  gameId: string;
}

export interface IncrementCounterPayload {
  gameId: string;
}

export interface EndTurnPayload {
  gameId: string;
  turnId: string;
}

export interface GameTurnEndedPayload {
  gameId: string;
  nextPlayerId: string;
  turnNumber: number;
}

// --- Server -> Client Message Payloads ---

// This represents a single action taken by a player during their turn.
// It will be expanded as more actions are added.
export type TurnAction = {
  type: 'INCREMENT_COUNTER';
};

// The full, internal game state stored in Redis
export interface ServerGameState {
  [key: string]: unknown; // To allow for use as a RedisJSON object
  gameId: string;
  gameCode: string;
  turnNumber: number;
  currentPlayerId: string;
  players: Player[];
  turnActionLog: TurnAction[];
  mapData: MapData;
  gameState: {
    placeholderCounter: number;
  };
}

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

// Map update payload sent separately from game state
export interface MapUpdatePayload {
  gameId: string;
  mapData: MapData;
  checksum: string;
}

// A smaller, more frequent update
export interface CounterUpdatePayload {
    gameId: string;
    newCount: number;
}

// An error message from the server
export interface ErrorPayload {
  message: string;
  details?: unknown;
}

// A generic success/acknowledgement message
export interface AckPayload {
    status: 'ok';
    action: string; // e.g., 'game:subscribed'
} 