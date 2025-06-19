import { GameStateUpdatePayload } from '../../shared/types/socket.types';

/**
 * Applies the actions from the turnActionLog to a given game state to create a "preview" state
 * for the current player. This function does not modify the original gameState object.
 *
 * @param gameState The original game state from Redis.
 * @returns A new GameStateUpdatePayload object with the actions from the log applied.
 */
export function getPlayerTurnPreview(gameState: GameStateUpdatePayload): GameStateUpdatePayload {
  if (!gameState.turnActionLog || gameState.turnActionLog.length === 0) {
    return gameState;
  }

  // Create a deep copy to ensure the original state object is not mutated.
  const previewState = JSON.parse(JSON.stringify(gameState));

  // Iterate over the logged actions and apply their effects to the preview state.
  for (const action of previewState.turnActionLog) {
    if (action.type === 'INCREMENT_COUNTER') {
      previewState.gameState.placeholderCounter++;
    }
    // As new action types are added, they will be handled here.
  }

  return previewState;
} 