export const SOCKET_MESSAGE_TYPES = {
  // Server-to-Client
  GAME_STATE_UPDATE: 'game:state_update',
  GAME_MAP_UPDATE: 'game:map_update',
  GAME_COUNTER_UPDATE: 'game:counter_update',
  GAME_TURN_ENDED: 'game:turn_ended',
  GAME_PLAYER_JOINED: 'game:player_joined',

  // Client-to-Server
  CLIENT_READY: 'client:ready',
  GAME_INCREMENT_COUNTER: 'game:increment_counter',
  GAME_END_TURN: 'game:end_turn',
  USER_ALIVE_PING: 'user:alive_ping',
  CLIENT_GAME_VIEW_ACTIVE: 'client:game_view_active',
  CLIENT_GAME_VIEW_INACTIVE: 'client:game_view_inactive',

  // Bidirectional
  ERROR: 'error',
  GAME_CHAT: 'game:chat',
} as const;
