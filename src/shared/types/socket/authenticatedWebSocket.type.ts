import { WebSocket } from 'ws';

// Extend the WebSocket type to include user information
export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}
