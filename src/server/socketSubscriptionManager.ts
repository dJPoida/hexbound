import { AuthenticatedWebSocket, ServerGameState } from '../shared/types/socket';
import { AppDataSource } from './data-source';
import { User } from './entities/User.entity';
import redisClient from './redisClient';
import { pushService } from './services/push.service';

// Maps a gameId to a Set of connected clients (sockets) for that game
const gameSubscriptions = new Map<string, Set<AuthenticatedWebSocket>>();
// Maps a userId to a Set of their active WebSocket connections
const userSockets = new Map<string, Set<AuthenticatedWebSocket>>();
// Maps a userId to a Set of gameIds they are actively viewing
const activeGameViews = new Map<string, Set<string>>();

/**
 * Checks if a user has any active WebSocket connections.
 * @param userId The ID of the user to check.
 * @returns `true` if the user is connected, `false` otherwise.
 */
export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

/**
 * Subscribes a client's WebSocket connection to a specific game's updates
 * and tracks the user's connection.
 * @param ws The authenticated WebSocket connection of the client.
 * @param gameId The ID of the game to subscribe to.
 */
export function subscribe(ws: AuthenticatedWebSocket, gameId: string): void {
  if (!ws.userId) return;

  // Subscribe to game updates
  if (!gameSubscriptions.has(gameId)) {
    gameSubscriptions.set(gameId, new Set());
  }
  gameSubscriptions.get(gameId)!.add(ws);

  // Track the user's socket connection
  if (!userSockets.has(ws.userId)) {
    userSockets.set(ws.userId, new Set());
  }
  userSockets.get(ws.userId)!.add(ws);

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
    if (ws.userId) {
      console.log(`[SubscriptionManager] Client ${ws.userId} unsubscribed from game ${gameId}`);
    }
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
  // Unsubscribe from all game rooms
  gameSubscriptions.forEach((subscribers, gameId) => {
    if (subscribers.has(ws)) {
      unsubscribe(ws, gameId);
    }
  });

  // Remove the socket from the user's connection set
  if (ws.userId) {
    const userConnections = userSockets.get(ws.userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        userSockets.delete(ws.userId);
        console.log(`[SubscriptionManager] User ${ws.userId} is now fully offline.`);
      }
    }
  }

  // Also clear any active game views associated with this user
  // This is a safeguard in case the 'inactive' message is not received.
  if (ws.userId) {
    activeGameViews.delete(ws.userId);
    console.log(
      `[SubscriptionManager] Cleared all active game views for disconnected user ${ws.userId}`
    );
  }
}

/**
 * Broadcasts a message to all clients subscribed to a specific game.
 * @param gameId The ID of the game to broadcast to.
 * @param message The message (as a stringified JSON object) to send.
 * @param excludeWs An optional WebSocket connection to exclude from the broadcast (usually the sender).
 */
export function broadcastToGame(
  gameId: string,
  message: string,
  excludeWs?: AuthenticatedWebSocket
): void {
  const subscribers = gameSubscriptions.get(gameId);
  if (subscribers) {
    console.log(
      `[SubscriptionManager] Broadcasting to ${subscribers.size} clients in game ${gameId}`
    );
    subscribers.forEach(ws => {
      if (ws !== excludeWs && ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }
}

/**
 * Handles the logic for when a user disconnects, checking if it was their
 * turn in any active games and notifying them if so.
 * @param userId The ID of the user who disconnected.
 */
export async function handleDisconnect(userId: string): Promise<void> {
  // A brief delay to allow for immediate reconnection before checking.
  await new Promise(resolve => setTimeout(resolve, 2000));

  // After the delay, check if the user has truly gone offline.
  if (isUserOnline(userId)) {
    console.log(
      `[SubscriptionManager] User ${userId} reconnected quickly. Aborting disconnect handler.`
    );
    return;
  }

  console.log(`[SubscriptionManager] Handling final disconnection for user ${userId}.`);

  try {
    // 1. Find all games the user is a player in from the Postgres DB
    const userRepository = AppDataSource.getRepository(User);
    const userWithGames = await userRepository.findOne({
      where: { userId },
      relations: ['games'],
    });

    if (!userWithGames || userWithGames.games.length === 0) {
      console.log(`[SubscriptionManager] Disconnected user ${userId} is not in any games.`);
      return;
    }

    // 2. For each game, check the game state in Redis
    for (const game of userWithGames.games) {
      const gameKey = `game:${game.gameId}`;
      const gameState = (await redisClient.json.get(gameKey)) as ServerGameState | null;

      if (!gameState) {
        console.warn(
          `[SubscriptionManager] Could not find game state in Redis for gameId: ${game.gameId}`
        );
        continue;
      }

      // 3. If it's the user's turn, send a notification
      if (gameState.currentPlayerId === userId && gameState.status === 'IN_PROGRESS') {
        console.log(
          `[SubscriptionManager] User ${userId} was disconnected on their turn for game ${game.gameCode}.`
        );
        const notification = {
          title: 'Your Turn!',
          body: `It's your turn in game ${game.gameCode}.`,
          data: {
            gameCode: game.gameCode,
          },
        };
        await pushService.sendNotification(userId, notification);
      }
    }
  } catch (error) {
    console.error(`[SubscriptionManager] Error in handleDisconnect for user ${userId}:`, error);
  }
}

/**
 * Registers that a user is actively viewing a specific game.
 */
export function setActiveGameView(userId: string, gameId: string) {
  if (!activeGameViews.has(userId)) {
    activeGameViews.set(userId, new Set());
  }
  activeGameViews.get(userId)!.add(gameId);
  console.log(`[SubscriptionManager] User ${userId} is now actively viewing game ${gameId}`);
}

/**
 * Removes a user's active view status from a specific game.
 */
export function removeActiveGameView(userId: string, gameId: string) {
  if (activeGameViews.has(userId)) {
    activeGameViews.get(userId)!.delete(gameId);
    if (activeGameViews.get(userId)!.size === 0) {
      activeGameViews.delete(userId);
    }
    console.log(`[SubscriptionManager] User ${userId} is no longer viewing game ${gameId}`);
  }
}

/**
 * Checks if a user is actively viewing a specific game.
 * @returns `true` if the user is viewing the game, `false` otherwise.
 */
export function isUserViewingGame(userId: string, gameId: string): boolean {
  return activeGameViews.has(userId) && activeGameViews.get(userId)!.has(gameId);
}
