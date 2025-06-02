import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';
import * as webPushNamespace from 'web-push';

// Helper function to generate the namespaced Redis key prefix for games
function getGameKeyPrefix(): string {
  const env = process.env.VERCEL_ENV || 'localdev'; // Default to 'localdev' if VERCEL_ENV is not set
  const prefix = `${env}:game:`;
  // console.log(`[API end-turn] Using Redis key prefix: ${prefix}`); // Optional: log for debugging
  return prefix;
}

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
  player1_id?: string;
  player1_name?: string;
  player1_session_id?: string;
  player1_push_sub?: string;
  player2_id?: string;
  player2_name?: string;
  player2_session_id?: string;
  player2_push_sub?: string;
  current_turn_player_id?: string;
  counter?: string;
  player_count?: string;
}

interface GameStateInternal {
  player1_id: string | null;
  player1_name: string | null;
  player1_session_id: string | null;
  player1_push_sub: string | null;
  player2_id: string | null;
  player2_name: string | null;
  player2_session_id: string | null;
  player2_push_sub: string | null;
  current_turn_player_id: string | null;
  counter: number;
  player_count: number;
}

function parseGameStateFromRedis(raw: GameStateInRedis): GameStateInternal | null {
  if (Object.keys(raw).length === 0) return null;
  return {
    player1_id: raw.player1_id === '' ? null : raw.player1_id || null,
    player1_name: raw.player1_name || null,
    player1_session_id: raw.player1_session_id === '' ? null : raw.player1_session_id || null,
    player1_push_sub: raw.player1_push_sub === '' ? null : raw.player1_push_sub || null,
    player2_id: raw.player2_id === '' ? null : raw.player2_id || null,
    player2_name: raw.player2_name || null,
    player2_session_id: raw.player2_session_id === '' ? null : raw.player2_session_id || null,
    player2_push_sub: raw.player2_push_sub === '' ? null : raw.player2_push_sub || null,
    current_turn_player_id: raw.current_turn_player_id === '' ? null : raw.current_turn_player_id || null,
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

  const { gameId, playerId, counter: newCounterValueFromClient } = request.body;

  if (!gameId || typeof gameId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid gameId.' });
  }
  if (!playerId || typeof playerId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid playerId.' });
  }
  if (typeof newCounterValueFromClient !== 'number') {
    return response.status(400).json({ message: 'Invalid counter value provided.' });
  }

  const gameKey = `${getGameKeyPrefix()}${gameId}`;
  console.log(`[API end-turn] GameKey: ${gameKey}, PlayerID ending turn: ${playerId}`);

  try {
    const rawGameState = await redis.hgetall(gameKey) as GameStateInRedis;
    const gameState = parseGameStateFromRedis(rawGameState);

    if (!gameState) {
      return response.status(404).json({ message: `Game ${gameId} not found.` });
    }

    if (gameState.current_turn_player_id !== playerId) {
      return response.status(403).json({ message: 'Not your turn!', currentTurnPlayerId: gameState.current_turn_player_id });
    }
    
    if (gameState.player_count < 2 || !gameState.player1_id || !gameState.player2_id) {
      return response.status(400).json({ message: 'Waiting for Player 2 to join (and be fully registered) before ending turn.'});
    }

    // Determine next player
    let nextPlayerId: string | null = null;
    let nextPlayerPushSub: string | null = null;
    let nextPlayerName: string | null = null;

    if (playerId === gameState.player1_id) {
      nextPlayerId = gameState.player2_id;
      nextPlayerPushSub = gameState.player2_push_sub;
      nextPlayerName = gameState.player2_name;
    } else if (playerId === gameState.player2_id) {
      nextPlayerId = gameState.player1_id;
      nextPlayerPushSub = gameState.player1_push_sub;
      nextPlayerName = gameState.player1_name;
    } else {
      // This case should be caught by the turn validation above.
      console.error(`[API end-turn] Critical error: Player ${playerId} is current turn player, but not P1 or P2.`);
      return response.status(500).json({ message: 'Error determining player roles.' });
    }

    if (!nextPlayerId) {
        // This implies P2 is not properly set up, which should be caught by player_count check too.
        return response.status(500).json({ message: 'Cannot determine next player. Is Player 2 fully present in game state?' });
    }

    await redis.hmset(gameKey, {
      counter: newCounterValueFromClient.toString(),
      current_turn_player_id: nextPlayerId,
    });

    console.log(`[API end-turn] Game ${gameId}: Turn ended by Player ID ${playerId}. New turn for Player ID ${nextPlayerId} (${nextPlayerName || 'N/A'}). Counter: ${newCounterValueFromClient}`);

    if (nextPlayerPushSub) {
      try {
        const pushSubscriptionObject = JSON.parse(nextPlayerPushSub);
        const payload = JSON.stringify({
          title: `Hexbound: It's Your Turn in ${gameId}!`,
          body: `${gameState.player1_name === nextPlayerName ? gameState.player2_name : gameState.player1_name} (P${playerId === gameState.player1_id ? '1' : '2'}) ended their turn. The counter is ${newCounterValueFromClient}.`,
          data: { gameId: gameId } 
        });
        await webPush.sendNotification(pushSubscriptionObject, payload);
        console.log(`[API end-turn] Push notification sent to next player (ID: ${nextPlayerId}) for game ${gameId}.`);
      } catch (pushError: any) {
        console.error(`[API end-turn] Error sending push notification to ${nextPlayerId} for ${gameId}:`, pushError.message, pushError.stack);
      }
    } else {
      console.warn(`[API end-turn] No push subscription found for next player (ID: ${nextPlayerId}, Name: ${nextPlayerName || 'N/A'}) in game ${gameId}.`);
    }

    response.status(200).json({
      message: 'Turn ended successfully.',
      newCounterValue: newCounterValueFromClient,
      nextTurnPlayerId: nextPlayerId,
    });

  } catch (error: any) {
    console.error(`[API end-turn] Error processing end turn for ${gameId} (Player ${playerId}):`, error.message, error.stack);
    response.status(500).json({ message: 'Error processing turn.', error: error.message });
  }
} 