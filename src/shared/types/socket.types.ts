import { WebSocket } from 'ws';

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
  players: {
      userId: string;
      userName:string;
  }[];
  turnActionLog: TurnAction[];
  // mapData: any; // To be defined later
  gameState: {
    placeholderCounter: number;
  };
}

// The game state payload that is sent to the client.
// It omits server-only fields like the turn action log.
export interface ClientGameStatePayload {
  gameId: string;
  gameCode: string;
  turnNumber: number;
  currentPlayerId: string;
  players: {
      userId: string;
      userName:string;
  }[];
  // mapData: any; // To be defined later
  gameState: {
    placeholderCounter: number;
  };
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