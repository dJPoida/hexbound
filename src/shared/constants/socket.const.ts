export const SOCKET_MESSAGE_TYPES = {
  // System messages
  ERROR: 'error',

  // Game subscription
  GAME_SUBSCRIBE: 'game:subscribe',
  GAME_UNSUBSCRIBE: 'game:unsubscribe',

  // Game state updates
  GAME_STATE_UPDATE: 'game:state_update',
  GAME_COUNTER_UPDATE: 'game:counter_update',
  GAME_TURN_ENDED: 'game:turn_ended',

  // Player actions
  GAME_INCREMENT_COUNTER: 'game:increment_counter',
  GAME_END_TURN: 'game:end_turn',
} as const; 