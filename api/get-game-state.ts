import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

// Define the namespace for Redis keys
const redisKeyNamespace = 'hexbound:game:';

// Initialize Redis client
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API get-game-state] REDIS_URL is not set. This should not appear in Vercel.');
}

interface GameStateInRedis {
  player1_session_id?: string;
  player2_session_id?: string;
  player1_push_sub?: string;
  player2_push_sub?: string;
  current_turn_player_session_id?: string;
  counter?: string; // Stored as string in Redis hgetall
  player_count?: string; // Stored as string in Redis hgetall
}

interface GameStateInternal {
  player1_session_id: string | null;
  player2_session_id: string | null;
  player1_push_sub: string | null;
  player2_push_sub: string | null;
  current_turn_player_session_id: string | null;
  counter: number;
  player_count: number;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { gameId, sessionId, pushSubscription } = request.body;

  if (!gameId || typeof gameId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid gameId.' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid sessionId.' });
  }
  // pushSubscription is optional on initial load if not yet granted

  const redisGameKey = `${redisKeyNamespace}${gameId}`;

  try {
    const rawGameStateFromRedis = await redis.hgetall(redisGameKey) as GameStateInRedis;
    let gameStateInternal: GameStateInternal | null = null;
    let playerNumberForThisClient: number | null = null;

    const pushSubString = pushSubscription ? JSON.stringify(pushSubscription) : null;

    if (Object.keys(rawGameStateFromRedis).length === 0) {
      // Game doesn't exist, create it and assign Player 1
      console.log(`[API get-game-state] Game ${gameId} not found. Creating...`);
      gameStateInternal = {
        player1_session_id: sessionId,
        player1_push_sub: pushSubString,
        player2_session_id: null,
        player2_push_sub: null,
        current_turn_player_session_id: sessionId, // Player 1 starts
        counter: 0,
        player_count: 1,
      };
      // For hmset, ensure numbers are converted to strings if Redis driver requires it, or handle types appropriately.
      // ioredis hmset can take an object, and it usually handles type conversions for simple types.
      await redis.hmset(redisGameKey, {
        player1_session_id: gameStateInternal.player1_session_id,
        player1_push_sub: gameStateInternal.player1_push_sub || '', // Store empty string for null to avoid issues with hgetall
        player2_session_id: gameStateInternal.player2_session_id || '',
        player2_push_sub: gameStateInternal.player2_push_sub || '',
        current_turn_player_session_id: gameStateInternal.current_turn_player_session_id,
        counter: gameStateInternal.counter.toString(),
        player_count: gameStateInternal.player_count.toString(),
      });
      playerNumberForThisClient = 1;
      console.log(`[API get-game-state] Game ${gameId} created. Player 1: ${sessionId}`);
    } else {
      // Game exists, parse it into our internal structure
      console.log(`[API get-game-state] Game ${gameId} found. SessionId: ${sessionId}`);
      gameStateInternal = {
        player1_session_id: rawGameStateFromRedis.player1_session_id || null,
        player2_session_id: rawGameStateFromRedis.player2_session_id || null,
        player1_push_sub: rawGameStateFromRedis.player1_push_sub || null,
        player2_push_sub: rawGameStateFromRedis.player2_push_sub || null,
        current_turn_player_session_id: rawGameStateFromRedis.current_turn_player_session_id || null,
        counter: parseInt(rawGameStateFromRedis.counter || '0', 10),
        player_count: parseInt(rawGameStateFromRedis.player_count || '0', 10),
      };

      // Clean up empty strings to nulls for push subs if they were stored as empty
      if (gameStateInternal.player1_push_sub === '') gameStateInternal.player1_push_sub = null;
      if (gameStateInternal.player2_push_sub === '') gameStateInternal.player2_push_sub = null;
      if (gameStateInternal.player1_session_id === '') gameStateInternal.player1_session_id = null;
      if (gameStateInternal.player2_session_id === '') gameStateInternal.player2_session_id = null;

      if (gameStateInternal.player1_session_id === sessionId) {
        playerNumberForThisClient = 1;
        if (pushSubString && gameStateInternal.player1_push_sub !== pushSubString) {
          await redis.hset(redisGameKey, 'player1_push_sub', pushSubString);
          gameStateInternal.player1_push_sub = pushSubString;
          console.log(`[API get-game-state] Updated push subscription for Player 1 in ${gameId}`);
        }
      } else if (gameStateInternal.player2_session_id === sessionId) {
        playerNumberForThisClient = 2;
        if (pushSubString && gameStateInternal.player2_push_sub !== pushSubString) {
          await redis.hset(redisGameKey, 'player2_push_sub', pushSubString);
          gameStateInternal.player2_push_sub = pushSubString;
          console.log(`[API get-game-state] Updated push subscription for Player 2 in ${gameId}`);
        }
      } else if (!gameStateInternal.player2_session_id && gameStateInternal.player_count < 2) {
        // Player 2 slot is open
        console.log(`[API get-game-state] Assigning Player 2 (${sessionId}) to game ${gameId}`);
        const updates: Partial<GameStateInRedis> = {
            player2_session_id: sessionId,
            player_count: '2',
        };
        if (pushSubString) updates.player2_push_sub = pushSubString;
        
        await redis.hmset(redisGameKey, updates);

        gameStateInternal.player2_session_id = sessionId;
        gameStateInternal.player2_push_sub = pushSubString;
        gameStateInternal.player_count = 2;
        playerNumberForThisClient = 2;
      } else {
        console.log(`[API get-game-state] Game ${gameId} is full or session ${sessionId} is not a player.`);
      }
    }
    
    const responseState = {
        gameId,
        playerNumberForThisClient,
        player1_session_id: gameStateInternal.player1_session_id || null,
        player2_session_id: gameStateInternal.player2_session_id || null,
        current_turn_player_session_id: gameStateInternal.current_turn_player_session_id || null,
        counter: gameStateInternal.counter,
        player_count: gameStateInternal.player_count,
    };

    return response.status(200).json(responseState);

  } catch (error: any) {
    console.error(`[API get-game-state] Error processing game state for ${gameId}:`, error.message, error.stack);
    return response.status(500).json({ message: 'Error retrieving or initializing game state.', error: error.message });
  }
} 