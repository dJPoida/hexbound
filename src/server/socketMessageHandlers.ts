import {
  AuthenticatedWebSocket,
  SocketMessage,
  GameSubscribePayload,
  IncrementCounterPayload,
  EndTurnPayload
} from '../shared/types/socket.types';
import * as subManager from './socketSubscriptionManager';
import redisClient from './redisClient';
import { broadcastToGame } from './socketSubscriptionManager';

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
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON format.' } }));
    return;
  }
  
  if (!isSocketMessage(parsedMessage)) {
    console.error(`[MessageHandler] Invalid message structure from ${ws.userId}:`, parsedMessage);
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message structure.' } }));
    return;
  }

  // Route message to appropriate handler based on type
  switch (parsedMessage.type) {
    case 'game:subscribe':
      handleSubscribe(ws, parsedMessage.payload as GameSubscribePayload);
      break;

    case 'game:unsubscribe':
      subManager.unsubscribe(ws, (parsedMessage.payload as GameSubscribePayload).gameId);
      break;

    case 'game:increment_counter':
      handleIncrementCounter(ws, parsedMessage.payload as IncrementCounterPayload);
      break;
    
    case 'game:end_turn':
        handleEndTurn(ws, parsedMessage.payload as EndTurnPayload);
        break;

    default:
      console.log(`[MessageHandler] Unknown message type from ${ws.userId}: ${parsedMessage.type}`);
      ws.send(JSON.stringify({ type: 'error', payload: { message: `Unknown message type: ${parsedMessage.type}` } }));
  }
}

async function handleSubscribe(ws: AuthenticatedWebSocket, payload: GameSubscribePayload) {
  const { gameId } = payload;
  subManager.subscribe(ws, gameId);

  // After subscribing, send the latest game state to the client
  try {
    const gameKey = `game:${gameId}`;
    const gameState = await redisClient.json.get(gameKey);

    if (gameState) {
      const updateMessage: SocketMessage<unknown> = {
        type: 'game:state_update',
        payload: gameState,
      };
      ws.send(JSON.stringify(updateMessage));
    } else {
      // Handle case where game state is not found
      ws.send(JSON.stringify({ type: 'error', payload: { message: `Game state for ${gameId} not found.` } }));
    }
  } catch (error) {
    console.error(`[MessageHandler] Error fetching game state for ${gameId}:`, error);
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Failed to retrieve game state.' } }));
  }
}

async function handleIncrementCounter(ws: AuthenticatedWebSocket, payload: IncrementCounterPayload) {
    const { gameId } = payload;
    const gameKey = `game:${gameId}`;

    try {
        // Increment the counter in Redis
        const newCountResult = await redisClient.json.numIncrBy(gameKey, '$.gameState.placeholderCounter', 1);
        const newCount = (newCountResult as number[])[0];

        // Prepare the update message
        const updateMessage: SocketMessage<{ gameId: string, newCount: number }> = {
            type: 'game:counter_update',
            payload: {
                gameId,
                newCount: newCount,
            }
        };

        // Broadcast the new count to everyone in the game
        broadcastToGame(gameId, JSON.stringify(updateMessage));

    } catch (error) {
        console.error(`[MessageHandler] Error incrementing counter for game ${gameId}:`, error);
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Failed to increment counter.' } }));
    }
}

async function handleEndTurn(ws: AuthenticatedWebSocket, payload: EndTurnPayload) {
    const { gameId } = payload;
    // Placeholder for turn-end logic
    console.log(`[MessageHandler] User ${ws.userId} ended turn for game ${gameId}.`);

    const updateMessage = {
        type: 'game:turn_ended',
        payload: {
            gameId,
            message: `Turn ended by ${ws.userId}. It's the next player's turn!`
        }
    };
    broadcastToGame(gameId, JSON.stringify(updateMessage));
} 