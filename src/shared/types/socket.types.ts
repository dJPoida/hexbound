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
}


// --- Server -> Client Message Payloads ---

// The full game state sent upon subscription or major updates
export interface GameStateUpdatePayload {
  [key: string]: unknown; // To allow for use as a RedisJSON object
  gameId: string;
  gameCode: string;
  turn: number;
  players: {
    [playerKey: string]: {
      userId: string;
      userName: string;
    };
  };
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