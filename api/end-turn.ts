import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';
import * as webPushNamespace from 'web-push';

// Define the namespace for Redis keys
const redisKeyNamespace = 'hexbound:game:'; 

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API end-turn] REDIS_URL is not set.');
}

const webPush = (webPushNamespace as any).default || webPushNamespace;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('[API end-turn] VAPID details configured.');
  } catch (e: any) {
    console.error('[API end-turn] Error configuring VAPID details:', e.message);
  }
} else {
  console.error('[API end-turn] Critical VAPID environment variables are missing. Push notifications might fail.');
}

// Interfaces (can be shared if moved to a common types file)
interface GameStateInRedis {
  player1_session_id?: string;
  player2_session_id?: string;
  player1_push_sub?: string;
  player2_push_sub?: string;
  current_turn_player_session_id?: string;
  counter?: string;
  player_count?: string;
}

interface GameStateInternal {
  player1_session_id: string | null;
  player2_session_id: string | null;
  player1_push_sub: string | null; // JSON string
  player2_push_sub: string | null; // JSON string
  current_turn_player_session_id: string | null;
  counter: number;
  player_count: number;
}

function parseGameStateFromRedis(raw: GameStateInRedis): GameStateInternal | null {
  if (Object.keys(raw).length === 0) return null;
  return {
    player1_session_id: raw.player1_session_id && raw.player1_session_id !== '' ? raw.player1_session_id : null,
    player2_session_id: raw.player2_session_id && raw.player2_session_id !== '' ? raw.player2_session_id : null,
    player1_push_sub: raw.player1_push_sub && raw.player1_push_sub !== '' ? raw.player1_push_sub : null,
    player2_push_sub: raw.player2_push_sub && raw.player2_push_sub !== '' ? raw.player2_push_sub : null,
    current_turn_player_session_id: raw.current_turn_player_session_id && raw.current_turn_player_session_id !== '' ? raw.current_turn_player_session_id : null,
    counter: parseInt(raw.counter || '0', 10),
    player_count: parseInt(raw.player_count || '0', 10),
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { gameId, sessionId, counter: newCounterValueFromClient } = request.body;

  if (!gameId || typeof gameId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid gameId.' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid sessionId.' });
  }
  if (typeof newCounterValueFromClient !== 'number') {
    return response.status(400).json({ message: 'Invalid counter value provided.' });
  }

  const redisGameKey = `${redisKeyNamespace}${gameId}`;

  try {
    const rawGameState = await redis.hgetall(redisGameKey) as GameStateInRedis;
    const gameState = parseGameStateFromRedis(rawGameState);

    if (!gameState) {
      return response.status(404).json({ message: `Game ${gameId} not found.` });
    }

    if (gameState.current_turn_player_session_id !== sessionId) {
      return response.status(403).json({ message: 'Not your turn!', currentTurn: gameState.current_turn_player_session_id });
    }
    
    if (gameState.player_count < 2) {
      return response.status(400).json({ message: 'Waiting for Player 2 to join before ending turn.'});
    }

    // Determine next player
    let nextPlayerSessionId: string | null = null;
    let nextPlayerPushSub: string | null = null;

    if (sessionId === gameState.player1_session_id) {
      nextPlayerSessionId = gameState.player2_session_id;
      nextPlayerPushSub = gameState.player2_push_sub;
    } else if (sessionId === gameState.player2_session_id) {
      nextPlayerSessionId = gameState.player1_session_id;
      nextPlayerPushSub = gameState.player1_push_sub;
    } else {
      // Should not happen due to turn check above, but as a safeguard:
      return response.status(500).json({ message: 'Error determining player roles.' });
    }

    if (!nextPlayerSessionId) {
        return response.status(500).json({ message: 'Cannot determine next player. Is Player 2 present?' });
    }

    // Update Redis: new counter value and switch turns
    // The counter sent by the client is the one from *their* local state before ending turn.
    // The `increment-counter` API will be responsible for actual increments during a turn.
    // Here, `end-turn` just records the state *as of the turn end* and passes control.
    await redis.hmset(redisGameKey, {
      counter: newCounterValueFromClient.toString(), // Persist the counter value from the client at turn end
      current_turn_player_session_id: nextPlayerSessionId,
    });

    console.log(`[API end-turn] Game ${gameId}: Turn ended by ${sessionId}. New turn for ${nextPlayerSessionId}. Counter: ${newCounterValueFromClient}`);

    // Send web push notification to the next player
    if (nextPlayerPushSub) {
      try {
        const pushSubscriptionObject = JSON.parse(nextPlayerPushSub);
        const payload = JSON.stringify({
          title: `Hexbound: It's Your Turn in ${gameId}!`,
          body: `The counter is now ${newCounterValueFromClient}. Take your turn!`,
          data: { gameId: gameId } // Optional: send gameId to focus tab on notification click
        });
        await webPush.sendNotification(pushSubscriptionObject, payload);
        console.log(`[API end-turn] Push notification sent to ${nextPlayerSessionId} for game ${gameId}.`);
      } catch (pushError: any) {
        console.error(`[API end-turn] Error sending push notification to ${nextPlayerSessionId} for ${gameId}:`, pushError.message);
        // Don't fail the whole turn end if push fails
      }
    } else {
      console.warn(`[API end-turn] No push subscription found for next player ${nextPlayerSessionId} in game ${gameId}.`);
    }

    response.status(200).json({
      message: 'Turn ended successfully.',
      newCounterValue: newCounterValueFromClient, // Reflect the counter value at the end of the turn
      nextTurnPlayerSessionId: nextPlayerSessionId,
    });

  } catch (error: any) {
    console.error(`[API end-turn] Error processing end turn for ${gameId}:`, error.message, error.stack);
    response.status(500).json({ message: 'Error processing turn.', error: error.message });
  }
} 