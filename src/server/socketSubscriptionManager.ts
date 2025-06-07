import { AuthenticatedWebSocket } from './webSocketServer';

// Maps a gameId to a Set of connected clients (sockets) for that game
const gameSubscriptions = new Map<string, Set<AuthenticatedWebSocket>>();

/**
 * Subscribes a client's WebSocket connection to a specific game's updates.
 * @param ws The authenticated WebSocket connection of the client.
 * @param gameId The ID of the game to subscribe to.
 */
export function subscribe(ws: AuthenticatedWebSocket, gameId: string): void {
  if (!gameSubscriptions.has(gameId)) {
    gameSubscriptions.set(gameId, new Set());
  }
  gameSubscriptions.get(gameId)!.add(ws);
  console.log(`[SubscriptionManager] Client ${ws.userId} subscribed to game ${gameId}`);
}

/**
 * Unsubscribes a client's WebSocket connection from a specific game.
 * @param ws The authenticated WebSocket connection of the client.
 * @param gameId The ID of the game to unsubscribe from.
 */
export function unsubscribe(ws: AuthenticatedWebSocket, gameId: string): void {
  const subscribers = gameSubscriptions.get(gameId);
  if (subscribers) {
    subscribers.delete(ws);
    console.log(`[SubscriptionManager] Client ${ws.userId} unsubscribed from game ${gameId}`);
    if (subscribers.size === 0) {
      gameSubscriptions.delete(gameId);
      console.log(`[SubscriptionManager] No more subscribers for game ${gameId}, removing room.`);
    }
  }
}

/**
 * Unsubscribes a client from ALL game subscriptions they might have.
 * This is useful to call when a client disconnects.
 * @param ws The authenticated WebSocket connection of the client.
 */
export function unsubscribeFromAll(ws: AuthenticatedWebSocket): void {
    gameSubscriptions.forEach((subscribers, gameId) => {
        if (subscribers.has(ws)) {
            unsubscribe(ws, gameId);
        }
    });
}

/**
 * Broadcasts a message to all clients subscribed to a specific game.
 * @param gameId The ID of the game to broadcast to.
 * @param message The message (as a stringified JSON object) to send.
 * @param excludeWs An optional WebSocket connection to exclude from the broadcast (usually the sender).
 */
export function broadcastToGame(gameId: string, message: string, excludeWs?: AuthenticatedWebSocket): void {
  const subscribers = gameSubscriptions.get(gameId);
  if (subscribers) {
    console.log(`[SubscriptionManager] Broadcasting to ${subscribers.size} clients in game ${gameId}`);
    subscribers.forEach(ws => {
      if (ws !== excludeWs && ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }
} 