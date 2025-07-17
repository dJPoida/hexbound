import { ClientGameStatePayload, ServerGameState } from '../../shared/types/socket';

/**
 * Transforms the full server game state into a lighter, client-safe payload.
 * This function removes server-only fields, like the turn action log.
 * @param serverState The complete game state object from the server.
 * @returns A client-safe game state payload.
 */
export function toClientState(serverState: ServerGameState): ClientGameStatePayload {
  // Omit turnActionLog and mapData from the server state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { turnActionLog, mapData, ...clientState } = serverState;
  return clientState;
}
