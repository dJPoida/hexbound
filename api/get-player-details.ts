import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

// Helper function to get the environment-specific key prefix for player data
function getPlayersKeyPrefix(): string {
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:players:`;
}

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API get-player-details] REDIS_URL is not set.');
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

  const playersKeyPrefix = getPlayersKeyPrefix();
  const playerKey = `${playersKeyPrefix}${playerId}`;

  try {
    const playerName = await redis.hget(playerKey, 'name');

    if (playerName) {
      console.log(`[API get-player-details] Found player name '${playerName}' for ID: ${playerId}`);
      return response.status(200).json({ 
        playerId: playerId, 
        playerName: playerName 
      });
    } else {
      console.log(`[API get-player-details] Player not found for ID: ${playerId}`);
      return response.status(404).json({ message: 'Player not found.' });
    }

  } catch (error: any) {
    console.error(`[API get-player-details] Error fetching player details for ID '${playerId}':`, error.message, error.stack);
    return response.status(500).json({ message: 'Error fetching player details.', error: error.message });
  }
} 