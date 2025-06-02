import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

// --- Redis Key Prefix Helpers ---
function getGameKeyPrefix(): string {
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:game:`;
}

function getPlayersKeyPrefix(): string { // For fetching player names
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:players:`;
}

function getPlayerGamesKey(playerId: string): string { // For player's list of games
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:player_games:${playerId}`;
}

// Initialize Redis client
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API get-game-state] REDIS_URL is not set.');
}

// --- Helper to fetch player name ---
async function getPlayerName(playerId: string): Promise<string | null> {
  if (!playerId) return null;
  try {
    return await redis.hget(`${getPlayersKeyPrefix()}${playerId}`, 'name');
  } catch (error) {
    console.error(`[API get-game-state] Error fetching name for playerId ${playerId}:`, error);
    return null;
  }
}

// --- Interfaces ---
interface GameStateInRedis {
  player1_id?: string;
  player1_name?: string;
  player1_session_id?: string; // Session ID of P1 for this game instance
  player1_push_sub?: string;
  player2_id?: string;
  player2_name?: string;
  player2_session_id?: string; // Session ID of P2 for this game instance
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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { gameId, sessionId, pushSubscription, playerId } = request.body;

  if (!gameId || typeof gameId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid gameId.' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid sessionId.' });
  }
  if (!playerId || typeof playerId !== 'string') {
    return response.status(400).json({ message: 'Missing or invalid playerId.' });
  }
  // pushSubscription is optional

  const gameKey = `${getGameKeyPrefix()}${gameId}`;
  console.log(`[API get-game-state] GameKey: ${gameKey}, PlayerID: ${playerId}, SessionID: ${sessionId}`);

  try {
    const rawGameStateFromRedis = await redis.hgetall(gameKey) as GameStateInRedis;
    let gameStateInternal: GameStateInternal;
    let playerNumberForThisClient: number | null = null;
    let playerNameForThisClient: string | null = await getPlayerName(playerId);

    if (!playerNameForThisClient) {
        console.warn(`[API get-game-state] Could not fetch player name for playerId: ${playerId}. This might be an issue if they are creating/joining a game.`);
        // Allow to proceed, but name might be missing if this player is new to the game
    }

    const pushSubString = pushSubscription ? JSON.stringify(pushSubscription) : null;
    const redisTransaction = redis.multi();
    let gameNeedsCreation = false;

    if (Object.keys(rawGameStateFromRedis).length === 0) {
      // Game doesn't exist, create it with the current player as Player 1
      console.log(`[API get-game-state] Game ${gameId} not found. Creating with Player 1 (ID: ${playerId})...`);
      gameNeedsCreation = true;
      const p1Name = playerNameForThisClient || 'Player 1'; // Fallback name

      gameStateInternal = {
        player1_id: playerId,
        player1_name: p1Name,
        player1_session_id: sessionId,
        player1_push_sub: pushSubString,
        player2_id: null,
        player2_name: null,
        player2_session_id: null,
        player2_push_sub: null,
        current_turn_player_id: playerId, // Player 1 starts
        counter: 0,
        player_count: 1,
      };

      redisTransaction.hmset(gameKey, {
        player1_id: gameStateInternal.player1_id,
        player1_name: gameStateInternal.player1_name,
        player1_session_id: gameStateInternal.player1_session_id, // Persist session for P1
        player1_push_sub: gameStateInternal.player1_push_sub || '',
        // player2 fields are null initially
        player2_id: '', player2_name: '', player2_session_id: '', player2_push_sub: '',
        current_turn_player_id: gameStateInternal.current_turn_player_id,
        counter: gameStateInternal.counter.toString(),
        player_count: gameStateInternal.player_count.toString(),
      });
      redisTransaction.sadd(getPlayerGamesKey(playerId), gameId); // Add game to P1's list
      playerNumberForThisClient = 1;
      console.log(`[API get-game-state] Game ${gameId} created. Player 1: ${p1Name} (ID: ${playerId}).`);
    } else {
      // Game exists, parse it
      console.log(`[API get-game-state] Game ${gameId} found. Current PlayerID: ${playerId}`);
      gameStateInternal = {
        player1_id: rawGameStateFromRedis.player1_id || null,
        player1_name: rawGameStateFromRedis.player1_name || null,
        player1_session_id: rawGameStateFromRedis.player1_session_id || null,
        player1_push_sub: rawGameStateFromRedis.player1_push_sub === '' ? null : rawGameStateFromRedis.player1_push_sub || null,
        player2_id: rawGameStateFromRedis.player2_id || null,
        player2_name: rawGameStateFromRedis.player2_name || null,
        player2_session_id: rawGameStateFromRedis.player2_session_id || null,
        player2_push_sub: rawGameStateFromRedis.player2_push_sub === '' ? null : rawGameStateFromRedis.player2_push_sub || null,
        current_turn_player_id: rawGameStateFromRedis.current_turn_player_id || null,
        counter: parseInt(rawGameStateFromRedis.counter || '0', 10),
        player_count: parseInt(rawGameStateFromRedis.player_count || '0', 10),
      };
      // Clean up empty string IDs that might have been stored by previous logic
      if (gameStateInternal.player1_id === '') gameStateInternal.player1_id = null;
      if (gameStateInternal.player2_id === '') gameStateInternal.player2_id = null;

      if (gameStateInternal.player1_id === playerId) {
        playerNumberForThisClient = 1;
        let p1UpdateNeeded = false;
        const p1Updates: GameStateInRedis = {};
        if (gameStateInternal.player1_session_id !== sessionId) {
            p1Updates.player1_session_id = sessionId;
            gameStateInternal.player1_session_id = sessionId;
            p1UpdateNeeded = true;
        }
        if (pushSubString && gameStateInternal.player1_push_sub !== pushSubString) {
          p1Updates.player1_push_sub = pushSubString;
          gameStateInternal.player1_push_sub = pushSubString;
          p1UpdateNeeded = true;
        }
        if (p1UpdateNeeded) {
            redisTransaction.hmset(gameKey, p1Updates);
            console.log(`[API get-game-state] Updated session/push for Player 1 (ID: ${playerId}) in ${gameId}`);
        }
      } else if (gameStateInternal.player2_id === playerId) {
        playerNumberForThisClient = 2;
        let p2UpdateNeeded = false;
        const p2Updates: GameStateInRedis = {};
         if (gameStateInternal.player2_session_id !== sessionId) {
            p2Updates.player2_session_id = sessionId;
            gameStateInternal.player2_session_id = sessionId;
            p2UpdateNeeded = true;
        }
        if (pushSubString && gameStateInternal.player2_push_sub !== pushSubString) {
          p2Updates.player2_push_sub = pushSubString;
          gameStateInternal.player2_push_sub = pushSubString;
          p2UpdateNeeded = true;
        }
        if (p2UpdateNeeded) {
            redisTransaction.hmset(gameKey, p2Updates);
            console.log(`[API get-game-state] Updated session/push for Player 2 (ID: ${playerId}) in ${gameId}`);
        }
      } else if (!gameStateInternal.player2_id && gameStateInternal.player_count < 2 && gameStateInternal.player1_id !== playerId) {
        // Player 2 slot is open, and current player is not P1, assign as P2
        console.log(`[API get-game-state] Assigning Player 2 (ID: ${playerId}) to game ${gameId}`);
        const p2Name = playerNameForThisClient || 'Player 2'; // Fallback name

        const updates: GameStateInRedis = {
            player2_id: playerId,
            player2_name: p2Name,
            player2_session_id: sessionId,
            player_count: '2',
        };
        if (pushSubString) updates.player2_push_sub = pushSubString;
        
        redisTransaction.hmset(gameKey, updates);
        redisTransaction.sadd(getPlayerGamesKey(playerId), gameId); // Add game to P2's list

        gameStateInternal.player2_id = playerId;
        gameStateInternal.player2_name = p2Name;
        gameStateInternal.player2_session_id = sessionId;
        gameStateInternal.player2_push_sub = pushSubString;
        gameStateInternal.player_count = 2;
        playerNumberForThisClient = 2;
        console.log(`[API get-game-state] Player 2 ${p2Name} (ID: ${playerId}) joined ${gameId}.`);
      } else {
        console.log(`[API get-game-state] Game ${gameId} is full, or player ${playerId} (name: ${playerNameForThisClient}) is not P1 or P2, or is trying to join as P2 when already P1.`);
        // Player is a spectator or there's a role mismatch.
      }
    }
    
    await redisTransaction.exec().catch(err => {
        console.error("[API get-game-state] Redis transaction error:", err);
        // Don't throw here, try to send a response if possible, or the main try-catch will handle it
        throw new Error("Redis transaction failed during game state update.");
    });

    // If after all logic, gameStateInternal is still not set (should not happen if gameNeedsCreation was true)
    if (!gameStateInternal && gameNeedsCreation) {
        // This case indicates an issue, perhaps P1 name couldn't be fetched and we didn't handle it gracefully enough
        // For now, let's assume if gameNeedsCreation is true, gameStateInternal WILL be populated.
        console.error("[API get-game-state] CRITICAL: gameStateInternal not populated after game creation flag was set.");
        // Defensive coding: if somehow gameStateInternal is null here, we must construct a minimal valid object or error out.
        // This path should ideally be unreachable if logic above is correct.
        return response.status(500).json({ message: 'Critical error: Failed to initialize game state object during creation.' });
    }
    // If game existed and current player is neither P1 nor P2, gameStateInternal would be from Redis but playerNumberForThisClient null.
    // This is fine, they are a spectator.

    const responseState = {
        gameId,
        playerNumberForThisClient,
        player1_id: gameStateInternal.player1_id || null,
        player1_name: gameStateInternal.player1_name || null,
        player1_session_id: gameStateInternal.player1_session_id || null, 
        player2_id: gameStateInternal.player2_id || null,
        player2_name: gameStateInternal.player2_name || null,
        player2_session_id: gameStateInternal.player2_session_id || null,
        current_turn_player_id: gameStateInternal.current_turn_player_id || null,
        counter: gameStateInternal.counter,
        player_count: gameStateInternal.player_count,
    };

    return response.status(200).json(responseState);

  } catch (error: any) {
    console.error(`[API get-game-state] Error processing game state for ${gameId} (Player ${playerId}):`, error.message, error.stack);
    return response.status(500).json({ message: 'Error retrieving or initializing game state.', error: error.message });
  }
} 