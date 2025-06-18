import { ServerGameState, ClientGameStatePayload } from '../../shared/types/socket.types';

/**
 * Transforms the full server game state into a lighter, client-safe payload.
 * This function removes server-only fields, like the turn action log.
 * @param serverState The complete game state object from the server.
 * @returns A client-safe game state payload.
 */
export function toClientState(serverState: ServerGameState): ClientGameStatePayload {
  const { turnActionLog, ...clientState } = serverState;
  return clientState;
} 