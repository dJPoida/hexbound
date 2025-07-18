import { RedisJSON } from '@redis/json/dist/commands';

import { SOCKET_MESSAGE_TYPES } from '../shared/constants/socket.const';
import { Player } from '../shared/types/core';
import {
  AuthenticatedWebSocket,
  ClientGameStatePayload,
  EndTurnPayload,
  MapUpdatePayload,
  ServerGameState,
  SocketMessage,
  TurnAction,
} from '../shared/types/socket';
import { calculateMapChecksum } from './helpers/calculateMapChecksum.helper';
import { toClientState } from './helpers/clientState.helper';
import { getPlayerTurnPreview } from './helpers/gameState.helper';
import redisClient from './redisClient';
import { pushService } from './services/push.service';
import {
  broadcastToGame,
  isUserViewingGame,
  removeActiveGameView,
  setActiveGameView,
  subscribe,
} from './socketSubscriptionManager';

// A simple type guard to check if a message is a valid SocketMessage
function isValidSocketMessage(msg: unknown): msg is SocketMessage<unknown> {
  if (typeof msg !== 'object' || msg === null) return false;
  return 'type' in msg && 'payload' in msg;
}

// Define payload type for messages that only contain a gameId
interface GameIdPayload {
  gameId: string;
}

// Map to store pending notification timeouts
const pendingTurnNotifications = new Map<string, NodeJS.Timeout>();

/**
 * Cancels a pending "Your Turn" notification for a user if one exists.
 */
function cancelTurnNotification(userId: string) {
  if (pendingTurnNotifications.has(userId)) {
    console.log(`[Activity] Cancelling pending turn notification for user ${userId}.`);
    clearTimeout(pendingTurnNotifications.get(userId)!);
    pendingTurnNotifications.delete(userId);
  }
}

export function handleSocketMessage(ws: AuthenticatedWebSocket, message: Buffer) {
  if (!ws.userId) {
    return ws.send(
      JSON.stringify({
        type: SOCKET_MESSAGE_TYPES.ERROR,
        payload: { message: 'Authentication required.' },
      })
    );
  }
  cancelTurnNotification(ws.userId);

  let parsedMessage: SocketMessage<unknown>;
  try {
    const parsedData = JSON.parse(message.toString());
    if (!isValidSocketMessage(parsedData)) {
      console.warn(`[MessageHandler] Received malformed message from ${ws.userId}`);
      return;
    }
    parsedMessage = parsedData;
  } catch (error) {
    console.error('[MessageHandler] Failed to parse message:', error);
    return;
  }

  switch (parsedMessage.type) {
    case SOCKET_MESSAGE_TYPES.CLIENT_READY:
      handleClientReady(ws, parsedMessage.payload as GameIdPayload);
      break;
    case SOCKET_MESSAGE_TYPES.GAME_INCREMENT_COUNTER:
      handleIncrementCounter(ws, parsedMessage.payload as GameIdPayload);
      break;
    case SOCKET_MESSAGE_TYPES.GAME_END_TURN:
      handleEndTurn(ws, parsedMessage.payload as EndTurnPayload);
      break;
    case SOCKET_MESSAGE_TYPES.USER_ALIVE_PING:
      break;
    case SOCKET_MESSAGE_TYPES.CLIENT_GAME_VIEW_ACTIVE:
      if (ws.userId) {
        setActiveGameView(ws.userId, (parsedMessage.payload as GameIdPayload).gameId);
      }
      break;
    case SOCKET_MESSAGE_TYPES.CLIENT_GAME_VIEW_INACTIVE:
      if (ws.userId) {
        removeActiveGameView(ws.userId, (parsedMessage.payload as GameIdPayload).gameId);
      }
      break;
    default:
      console.warn(`[MessageHandler] Unknown message type: ${parsedMessage.type}`);
  }
}

async function handleClientReady(ws: AuthenticatedWebSocket, payload: GameIdPayload) {
  const { userId } = ws;
  const { gameId } = payload;

  if (!userId) return;

  subscribe(ws, gameId);

  const gameKey = `game:${gameId}`;
  const gameState = (await redisClient.json.get(gameKey)) as ServerGameState | null;

  if (!gameState) {
    return ws.send(
      JSON.stringify({
        type: SOCKET_MESSAGE_TYPES.ERROR,
        payload: { message: `Game state not found for game ${gameId}.` },
      })
    );
  }

  // Send game state (without map data)
  const stateToSend = toClientState(gameState);
  ws.send(JSON.stringify({ type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE, payload: stateToSend }));

  // Send map data separately to this specific client
  const checksum = calculateMapChecksum(gameState.mapData);
  const mapUpdateMessage: SocketMessage<MapUpdatePayload> = {
    type: SOCKET_MESSAGE_TYPES.GAME_MAP_UPDATE,
    payload: {
      gameId,
      mapData: gameState.mapData,
      checksum,
    },
  };
  ws.send(JSON.stringify(mapUpdateMessage));
  console.log(
    `[ClientReady] Sent map update to client ${userId} for game ${gameId} with checksum ${checksum}`
  );
}

async function handleIncrementCounter(ws: AuthenticatedWebSocket, payload: GameIdPayload) {
  const { gameId } = payload;
  const { userId } = ws;

  if (!userId) return;

  const gameKey = `game:${gameId}`;
  const gameState = (await redisClient.json.get(gameKey)) as ServerGameState | null;
  if (!gameState) return;

  if (gameState.currentPlayerId !== userId) {
    return ws.send(
      JSON.stringify({
        type: SOCKET_MESSAGE_TYPES.ERROR,
        payload: { message: 'It is not your turn.' },
      })
    );
  }

  const action: TurnAction = { type: 'INCREMENT_COUNTER' };
  await redisClient.json.arrAppend(gameKey, '$.turnActionLog', action as unknown as RedisJSON);
  const updatedGameState = (await redisClient.json.get(gameKey)) as ServerGameState;
  const previewState = getPlayerTurnPreview(updatedGameState);

  const stateUpdateMessage: SocketMessage<ClientGameStatePayload> = {
    type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
    payload: toClientState(previewState),
  };
  ws.send(JSON.stringify(stateUpdateMessage));
}

async function handleEndTurn(ws: AuthenticatedWebSocket, payload: EndTurnPayload) {
  const { gameId } = payload;
  const { userId: playerWhoSentMessage } = ws;
  if (!playerWhoSentMessage) return;

  const gameKey = `game:${gameId}`;
  const gameState = (await redisClient.json.get(gameKey)) as ServerGameState | null;
  if (!gameState) return;

  if (gameState.currentPlayerId !== playerWhoSentMessage) {
    return ws.send(
      JSON.stringify({
        type: SOCKET_MESSAGE_TYPES.ERROR,
        payload: { message: 'It is not your turn to end.' },
      })
    );
  }

  // Check if any players are placeholders
  const hasPlaceholders = gameState.players.some(p => p.isPlaceholder);
  if (hasPlaceholders) {
    return ws.send(
      JSON.stringify({
        type: SOCKET_MESSAGE_TYPES.ERROR,
        payload: { message: 'Cannot end turn while waiting for all players to join.' },
      })
    );
  }

  const stateAfterActions = getPlayerTurnPreview(gameState);

  const currentPlayerIndex = gameState.players.findIndex(
    (p: Player) => p.userId === playerWhoSentMessage
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
  const nextPlayer = gameState.players[nextPlayerIndex];

  const notificationTimeout = setTimeout(() => {
    if (!isUserViewingGame(nextPlayer.userId, gameId)) {
      const notification = {
        title: 'Hexbound: Your Turn!',
        body: `It's your turn to make a move in game ${stateAfterActions.gameCode}.`,
        data: { gameCode: stateAfterActions.gameCode },
      };
      console.log(`[EndTurn] Sending delayed push notification to: ${nextPlayer.userId}`);
      pushService.sendNotification(nextPlayer.userId, notification);
    } else {
      console.log(
        `[EndTurn] Next player ${nextPlayer.userId} is actively viewing the game. Skipping delayed notification.`
      );
    }
    pendingTurnNotifications.delete(nextPlayer.userId);
  }, 15000);

  pendingTurnNotifications.set(nextPlayer.userId, notificationTimeout);

  const newTurnNumber =
    currentPlayerIndex === gameState.players.length - 1
      ? stateAfterActions.turnNumber + 1
      : stateAfterActions.turnNumber;

  const newGameState: Partial<ServerGameState> = {
    ...stateAfterActions,
    currentPlayerId: nextPlayer.userId,
    turnActionLog: [],
    turnNumber: newTurnNumber,
  };

  await redisClient.json.set(gameKey, '$', newGameState as unknown as RedisJSON);

  // Send updated game state to all players
  const stateUpdateMessage: SocketMessage<ClientGameStatePayload> = {
    type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
    payload: toClientState(newGameState as ServerGameState),
  };
  broadcastToGame(gameId, JSON.stringify(stateUpdateMessage));

  // Send turn ended notification
  const turnEndedMessage: SocketMessage<{
    gameId: string;
    nextPlayerId: string;
    turnNumber: number;
  }> = {
    type: SOCKET_MESSAGE_TYPES.GAME_TURN_ENDED,
    payload: {
      gameId: gameId,
      nextPlayerId: nextPlayer.userId,
      turnNumber: newTurnNumber,
    },
  };
  broadcastToGame(gameId, JSON.stringify(turnEndedMessage));
}
