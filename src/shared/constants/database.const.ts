// Database and server-specific enums and constants

// Game status values (already partially defined in game.types.ts)
export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'IN_PROGRESS', // Note: This appears to be used in the codebase
  ACTIVE = 'active',
  FINISHED = 'finished',
}

// Database error codes
export enum DatabaseErrorCode {
  UNIQUE_VIOLATION = '23505', // PostgreSQL unique constraint violation
}

// HTTP methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

// Column types for TypeORM
export enum ColumnType {
  TEXT = 'text',
  VARCHAR = 'varchar',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  TIMESTAMP = 'timestamp',
  UUID = 'uuid',
}

// WebSocket paths
export enum WebSocketPath {
  WS = '/ws',
}

// API paths (should be moved from api.const.ts eventually)
export enum ApiPath {
  GAMES = '/api/games',
}

// Socket message types (complement to existing socket.const.ts)
export enum SocketMessageType {
  ERROR = 'error',
}

// Node.js error codes
export enum NodeErrorCode {
  SERVER_NOT_RUNNING = 'ERR_SERVER_NOT_RUNNING',
} 