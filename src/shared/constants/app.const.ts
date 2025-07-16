// Application-specific enums and constants

// Main application views/routes
export enum AppView {
  LOGIN = 'login',
  LOBBY = 'lobby',
  GAME = 'game',
}

// Page types for navigation within lobby/utility areas
export enum PageType {
  LOBBY = 'lobby',
  STYLEGUIDE = 'styleguide',
  UTILS = 'utils',
}

// Dialog types used throughout the application
export enum DialogType {
  GAME_SETTINGS = 'gameSettings',
  INCREMENT_COUNTER = 'incrementCounter',
  DEBUG_INFO = 'debugInfo',
}

// WebSocket connection status
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
}

// Notification permission states (extends native Notification API)
export enum NotificationPermission {
  DEFAULT = 'default',
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
}

// Copy status for clipboard operations
export enum CopyStatus {
  IDLE = 'idle',
  COPIED = 'copied',
}

// Environment types
export enum NodeEnvironment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

// Document visibility states
export enum VisibilityState {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}

// Browser protocols
export enum Protocol {
  HTTP = 'http:',
  HTTPS = 'https:',
}

// WebSocket protocols
export enum WebSocketProtocol {
  WS = 'ws',
  WSS = 'wss',
}

// Event keys for keyboard interactions
export enum KeyboardKey {
  ESCAPE = 'Escape',
  ENTER = 'Enter',
  SPACE = ' ',
}

// Game action types
export enum GameActionType {
  INCREMENT_COUNTER = 'INCREMENT_COUNTER',
}

// Service Worker message types
export enum ServiceWorkerMessageType {
  SKIP_WAITING = 'SKIP_WAITING',
}
