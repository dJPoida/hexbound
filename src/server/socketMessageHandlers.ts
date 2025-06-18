import {
  AuthenticatedWebSocket,
  SocketMessage,
  GameSubscribePayload,
  IncrementCounterPayload,
  EndTurnPayload,
  GameStateUpdatePayload,
} from '../shared/types/socket.types';
import * as subManager from './socketSubscriptionManager';
import redisClient from './redisClient';
import { broadcastToGame } from './socketSubscriptionManager';
import { AppDataSource } from './data-source';
import { Game } from './entities/Game.entity';
import { User } from './entities/User.entity';
import { RedisJSON } from '@redis/json/dist/commands';
import { SOCKET_MESSAGE_TYPES } from '../shared/constants/socket.const';
import { createRedisKey, REDIS_KEY_PREFIXES } from '../shared/constants/redis.const';

// A simple type guard to check if a message is a valid SocketMessage
function isSocketMessage(msg: unknown): msg is SocketMessage<unknown> {
  return typeof msg === 'object' && msg !== null && 'type' in msg && 'payload' in msg;
}

export function handleSocketMessage(ws: AuthenticatedWebSocket, message: Buffer) {
  let parsedMessage;
  try {
    parsedMessage = JSON.parse(message.toString());
  } catch (error) {
    console.error(`[MessageHandler] Failed to parse message from ${ws.userId}:`, message.toString());
    ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Invalid JSON format.' } }));
    return;
  }
  
  if (parsedMessage && parsedMessage.type === SOCKET_MESSAGE_TYPES.PING) {
    ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.PONG }));
    return;
  }

  if (!isSocketMessage(parsedMessage)) {
    console.error(`[MessageHandler] Invalid message structure from ${ws.userId}:`, parsedMessage);
    ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Invalid message structure.' } }));
    return;
  }

  // Route message to appropriate handler based on type
  switch (parsedMessage.type) {
    case SOCKET_MESSAGE_TYPES.GAME_SUBSCRIBE:
      handleSubscribe(ws, parsedMessage.payload as GameSubscribePayload);
      break;

    case SOCKET_MESSAGE_TYPES.GAME_UNSUBSCRIBE:
      subManager.unsubscribe(ws, (parsedMessage.payload as GameSubscribePayload).gameId);
      break;

    case SOCKET_MESSAGE_TYPES.GAME_INCREMENT_COUNTER:
      handleIncrementCounter(ws, parsedMessage.payload as IncrementCounterPayload);
      break;
    
    case SOCKET_MESSAGE_TYPES.GAME_END_TURN:
        handleEndTurn(ws, parsedMessage.payload as EndTurnPayload);
        break;

    default:
      console.log(`[MessageHandler] Unknown message type from ${ws.userId}: ${parsedMessage.type}`);
      ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: `Unknown message type: ${parsedMessage.type}` } }));
  }
}

async function handleSubscribe(ws: AuthenticatedWebSocket, payload: GameSubscribePayload) {
  const { gameId: gameIdentifier } = payload;
  const { userId } = ws;

  if (!userId) {
    // Should not happen with authenticated websockets
    return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Authentication required.' } }));
  }

  const gameRepository = AppDataSource.getRepository(Game);
  const userRepository = AppDataSource.getRepository(User);

  try {
    // Regex to check if the identifier is a UUID
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const isUuid = uuidRegex.test(gameIdentifier);

    // Find the game by ID or by Code
    const game = await gameRepository.findOne({
      where: isUuid ? { gameId: gameIdentifier } : { gameCode: gameIdentifier },
      relations: { players: true, status: true },
    });

    if (!game) {
      return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: `Game not found: ${gameIdentifier}` } }));
    }

    // From this point on, we use the definitive gameId from the database record.
    const gameId = game.gameId;
    const user = await userRepository.findOneBy({ userId });
    if (!user) {
      return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Authenticated user not found.' } }));
    }

    const isPlayerInGame = game.players.some((p: User) => p.userId === user.userId);

    if (!isPlayerInGame) {
      // Add player to the game in Postgres
      game.players.push(user);
      await gameRepository.save(game);

      // Add player to the game state in Redis
      const redisGameKey = createRedisKey(REDIS_KEY_PREFIXES.GAME_STATE, gameId);
      const redisGameState = (await redisClient.json.get(redisGameKey)) as unknown as GameStateUpdatePayload | null;

      if (redisGameState) {
        await redisClient.json.arrAppend(redisGameKey, '$.players', {
          userId: user.userId,
          userName: user.userName,
        } as unknown as RedisJSON);
      } else {
        console.error(`[MessageHandler] CRITICAL: Game ${gameId} found in DB but not in Redis.`);
        return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Game state is inconsistent. Cannot join.' } }));
      }
    }

    // Subscribe the user's websocket to this game's broadcast channel
    subManager.subscribe(ws, gameId);

    // Fetch the latest state from Redis (which may have just been updated)
    const gameKey = createRedisKey(REDIS_KEY_PREFIXES.GAME_STATE, gameId);
    const latestGameState = await redisClient.json.get(gameKey);

    if (latestGameState) {
      const updateMessage: SocketMessage<GameStateUpdatePayload> = {
        type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
        payload: latestGameState as unknown as GameStateUpdatePayload,
      };
      // Broadcast the new state to ALL connected clients in the game room
      broadcastToGame(gameId, JSON.stringify(updateMessage));
    } else {
      // This is a critical error if we reach here, as state should exist.
      console.error(`[MessageHandler] CRITICAL: Game state for ${gameId} disappeared after update.`);
      ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: `Game state for ${gameId} could not be retrieved.` } }));
    }
  } catch (error) {
    console.error(`[MessageHandler] Error in handleSubscribe for game ${gameIdentifier}:`, error);
    ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Failed to subscribe to game.' } }));
  }
}

async function handleIncrementCounter(ws: AuthenticatedWebSocket, payload: IncrementCounterPayload) {
    const { gameId } = payload;
    const gameKey = createRedisKey(REDIS_KEY_PREFIXES.GAME_STATE, gameId);

    try {
        // Increment the counter in Redis
        const newCountResult = await redisClient.json.numIncrBy(gameKey, '$.gameState.placeholderCounter', 1);
        const newCount = (newCountResult as number[])[0];

        // Prepare the update message
        const updateMessage: SocketMessage<{ gameId: string, newCount: number }> = {
            type: SOCKET_MESSAGE_TYPES.GAME_COUNTER_UPDATE,
            payload: {
                gameId,
                newCount: newCount,
            }
        };

        // Broadcast the new count to everyone in the game
        broadcastToGame(gameId, JSON.stringify(updateMessage));

    } catch (error) {
        console.error(`[MessageHandler] Error incrementing counter for game ${gameId}:`, error);
        ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Failed to increment counter.' } }));
    }
}

async function handleEndTurn(ws: AuthenticatedWebSocket, payload: EndTurnPayload) {
    const { gameId } = payload;
    // Placeholder for turn-end logic
    console.log(`[MessageHandler] User ${ws.userId} ended turn for game ${gameId}.`);

    const updateMessage = {
        type: SOCKET_MESSAGE_TYPES.GAME_TURN_ENDED,
        payload: {
            gameId,
            message: `Turn ended by ${ws.userId}. It's the next player's turn!`
        }
    };
    broadcastToGame(gameId, JSON.stringify(updateMessage));
} 