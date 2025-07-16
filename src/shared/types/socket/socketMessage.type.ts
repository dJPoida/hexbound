// Generic structure for all messages sent over WebSocket

export interface SocketMessage<T> {
  type: string;
  payload: T;
} 