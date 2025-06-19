import {
  AuthenticatedWebSocket,
  SocketMessage,
  GameSubscribePayload,
  IncrementCounterPayload,
  EndTurnPayload,
  ServerGameState,
  TurnAction,
  ClientGameStatePayload,
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
import { getPlayerTurnPreview } from './helpers/gameState.helper';
import { toClientState } from './helpers/clientState.helper';

// A simple type guard to check if a message is a valid SocketMessage
function isSocketMessage(msg: unknown): msg is SocketMessage<unknown> {
  if (typeof msg !== 'object' || msg === null) {
    return false;
  }
  return 'type' in msg && 'payload' in msg;
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
    return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Authentication required.' } }));
  }

  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const userRepository = AppDataSource.getRepository(User);
    
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const game = await gameRepository.findOne({
      where: uuidRegex.test(gameIdentifier) ? { gameId: gameIdentifier } : { gameCode: gameIdentifier },
      relations: { players: true, status: true },
    });

    if (!game) {
      return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: `Game not found: ${gameIdentifier}` } }));
    }

    const gameId = game.gameId;
    const gameKey = createRedisKey(REDIS_KEY_PREFIXES.GAME_STATE, gameId);
    const initialGameState = await redisClient.json.get(gameKey) as unknown as ServerGameState | null;

    if (!initialGameState) {
      console.error(`[MessageHandler] CRITICAL: Game ${gameId} found in DB but not in Redis.`);
      return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Game state is inconsistent.' } }));
    }

    const user = await userRepository.findOneBy({ userId });
    if (!user) {
      return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Authenticated user not found.' } }));
    }

    const isPlayerInGame = game.players.some((p: User) => p.userId === user.userId);

    // Subscribe the user's websocket to this game's broadcast channel first
    subManager.subscribe(ws, gameId);

    if (!isPlayerInGame) {
      // Logic for a new player joining the game
      if (initialGameState.turnNumber > 1) {
        return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'This game has already started and cannot be joined.' } }));
      }

      game.players.push(user);
      await gameRepository.save(game);
      await redisClient.json.arrAppend(gameKey, '$.players', { userId: user.userId, userName: user.userName } as unknown as RedisJSON);
      
      // Fetch the state again since it was modified
      const updatedGameState = await redisClient.json.get(gameKey) as unknown as ServerGameState;

      // Broadcast the new state to all players
      const broadcastMessage: SocketMessage<ClientGameStatePayload> = { type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE, payload: toClientState(updatedGameState) };
      broadcastToGame(gameId, JSON.stringify(broadcastMessage));

    } else {
      // Logic for an existing player reconnecting
      let stateToSend = initialGameState;
      if (initialGameState.currentPlayerId === userId) {
        // If it's the current player's turn, send them a preview of their actions
        stateToSend = getPlayerTurnPreview(initialGameState);
      }
      
      const updateMessage: SocketMessage<ClientGameStatePayload> = { type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE, payload: toClientState(stateToSend) };
      ws.send(JSON.stringify(updateMessage));
    }

  } catch (error) {
    console.error(`[MessageHandler] Error in handleSubscribe for game ${gameIdentifier}:`, error);
    ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Failed to subscribe to game.' } }));
  }
}

async function handleIncrementCounter(ws: AuthenticatedWebSocket, payload: IncrementCounterPayload) {
    const { gameId } = payload;
    const { userId } = ws;
    const gameKey = createRedisKey(REDIS_KEY_PREFIXES.GAME_STATE, gameId);

    try {
        const gameState = await redisClient.json.get(gameKey) as unknown as ServerGameState | null;

        if (!gameState) {
          return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: `Game state not found for game ${gameId}.` } }));
        }

        if (gameState.currentPlayerId !== userId) {
          return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'It is not your turn.' } }));
        }

        const action: TurnAction = { type: 'INCREMENT_COUNTER' };
        
        // Add the action to the turn log
        await redisClient.json.arrAppend(gameKey, '$.turnActionLog', action as unknown as RedisJSON);

        // Re-fetch the state to get the updated action log
        const updatedGameState = await redisClient.json.get(gameKey) as unknown as ServerGameState;

        // Generate the preview state for the current player
        const previewState = getPlayerTurnPreview(updatedGameState);

        // Send the updated preview state back to only the current player
        const updateMessage: SocketMessage<ClientGameStatePayload> = {
            type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
            payload: toClientState(previewState)
        };
        ws.send(JSON.stringify(updateMessage));

    } catch (error) {
        console.error(`[MessageHandler] Error incrementing counter for game ${gameId}:`, error);
        ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Failed to increment counter.' } }));
    }
}

async function handleEndTurn(ws: AuthenticatedWebSocket, payload: EndTurnPayload) {
    const { gameId } = payload;
    const { userId } = ws;
    const gameKey = createRedisKey(REDIS_KEY_PREFIXES.GAME_STATE, gameId);

    try {
      // 1. Fetch the current game state
      const gameState = await redisClient.json.get(gameKey) as unknown as ServerGameState | null;

      if (!gameState) {
        return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: `Game state not found for game ${gameId}.` } }));
      }

      // 2. Validate that it's the user's turn
      if (gameState.currentPlayerId !== userId) {
        return ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'It is not your turn to end.' } }));
      }

      // 3. Apply the logged actions to get the state at the end of the turn
      const stateAfterActions = getPlayerTurnPreview(gameState);

      // 4. Determine the next player
      const currentPlayerIndex = stateAfterActions.players.findIndex((p: { userId: string; }) => p.userId === userId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % stateAfterActions.players.length;
      const nextPlayer = stateAfterActions.players[nextPlayerIndex];

      // 5. Determine the next turn number
      const newTurnNumber = currentPlayerIndex === stateAfterActions.players.length - 1 
        ? stateAfterActions.turnNumber + 1 
        : stateAfterActions.turnNumber;

      // 6. Create the new game state object
      const newGameState: ServerGameState = {
        ...stateAfterActions,
        turnActionLog: [], // Clear the log
        currentPlayerId: nextPlayer.userId,
        turnNumber: newTurnNumber,
      };

      // 7. Atomically update the entire game state in Redis
      await redisClient.json.set(gameKey, '$', newGameState as unknown as RedisJSON);

      // 8. Broadcast the new state to all players in the game
      const updateMessage: SocketMessage<ClientGameStatePayload> = {
        type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
        payload: toClientState(newGameState),
      };
      broadcastToGame(gameId, JSON.stringify(updateMessage));

    } catch (error) {
      console.error(`[MessageHandler] Error ending turn for game ${gameId}:`, error);
      ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.ERROR, payload: { message: 'Failed to end turn.' } }));
    }
} 