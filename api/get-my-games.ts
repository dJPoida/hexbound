import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

// --- Redis Key Prefix Helpers ---
function getGameKeyPrefix(): string {
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:game:`;
}

function getPlayerGamesKey(playerId: string): string {
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:player_games:${playerId}`;
}

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API get-my-games] REDIS_URL is not set.');
}

interface GameDetailsForLobby {
  gameId: string;
  player1Id: string | null;
  player1Name: string | null;
  player2Id: string | null;
  player2Name: string | null;
  currentTurnPlayerId: string | null;
  opponentName: string | null; // Name of the other player relative to the requesting player
  isMyTurn: boolean;
  // We could add other summary fields like counter or lastActivity if desired
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { playerId } = request.query;

  if (!playerId || typeof playerId !== 'string') {
    return response.status(400).json({ message: 'Player ID must be provided as a string query parameter.' });
  }

  const playerGamesKey = getPlayerGamesKey(playerId);
  const gameKeyPrefix = getGameKeyPrefix();

  try {
    const gameIds = await redis.smembers(playerGamesKey);

    if (!gameIds || gameIds.length === 0) {
      return response.status(200).json([]); // No games for this player
    }

    const gamesDetailsPromises = gameIds.map(async (gameId) => {
      if (!gameId) return null; // Should not happen with SMEMBERS returning non-null strings
      const gameData = await redis.hgetall(`${gameKeyPrefix}${gameId}`);
      if (Object.keys(gameData).length === 0) {
        // Game ID was in player's list, but game data hash doesn't exist. Could be an orphaned entry.
        // Optionally, we could try to remove it from the player's list here.
        // redis.srem(playerGamesKey, gameId);
        console.warn(`[API get-my-games] Game data not found for gameId ${gameId} listed for player ${playerId}.`);
        return null;
      }

      const p1Id = gameData.player1_id || null;
      const p2Id = gameData.player2_id || null;
      let opponentName: string | null = null;

      if (playerId === p1Id) {
        opponentName = gameData.player2_name || (p2Id ? 'Player 2' : null);
      } else if (playerId === p2Id) {
        opponentName = gameData.player1_name || (p1Id ? 'Player 1' : null);
      }

      return {
        gameId: gameId,
        player1Id: p1Id,
        player1Name: gameData.player1_name || null,
        player2Id: p2Id,
        player2Name: gameData.player2_name || null,
        currentTurnPlayerId: gameData.current_turn_player_id || null,
        opponentName: opponentName,
        isMyTurn: (gameData.current_turn_player_id || null) === playerId,
      } as GameDetailsForLobby;
    });

    const gamesDetails = (await Promise.all(gamesDetailsPromises)).filter(game => game !== null) as GameDetailsForLobby[];
    
    // Optional: Sort games, e.g., by whose turn it is or by last activity (if tracked)
    gamesDetails.sort((a, b) => {
        if (a.isMyTurn && !b.isMyTurn) return -1;
        if (!a.isMyTurn && b.isMyTurn) return 1;
        // Could add secondary sort by gameId or a last_updated field if we store one
        return a.gameId.localeCompare(b.gameId);
    });

    return response.status(200).json(gamesDetails);

  } catch (error: any) {
    console.error(`[API get-my-games] Error fetching games for player ${playerId}:`, error.message, error.stack);
    return response.status(500).json({ message: 'Error fetching player games.', error: error.message });
  }
} 