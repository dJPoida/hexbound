import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid'; // For generating unique player IDs

// Helper function to get the environment-specific key prefix for player data
function getPlayersKeyPrefix(): string {
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:players:`;
}

// Helper function to get the environment-specific key prefix for player name to ID mapping
function getPlayerNameToIdKeyPrefix(): string {
  const env = process.env.VERCEL_ENV || 'localdev';
  return `${env}:playername_to_id:`;
}

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API register-player] REDIS_URL is not set.');
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { playerName } = request.body;

  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    return response.status(400).json({ message: 'Player name must be provided and be a non-empty string.' });
  }

  const normalizedPlayerName = playerName.trim().toLowerCase(); // Normalize for lookup
  const playersKeyPrefix = getPlayersKeyPrefix();
  const playerNameToIdKeyPrefix = getPlayerNameToIdKeyPrefix();

  try {
    // Check if player name already exists to allow resuming with the same ID
    const existingPlayerId = await redis.get(`${playerNameToIdKeyPrefix}${normalizedPlayerName}`);

    if (existingPlayerId) {
      // Player name exists, fetch their current canonical name (in case casing changed slightly)
      const canonicalName = await redis.hget(`${playersKeyPrefix}${existingPlayerId}`, 'name');
      console.log(`[API register-player] Player name '${normalizedPlayerName}' (input: '${playerName}') already exists with ID: ${existingPlayerId}. Canonical name: ${canonicalName}`);
      return response.status(200).json({ 
        playerId: existingPlayerId, 
        playerName: canonicalName || playerName // Prefer canonical, fallback to input if somehow missing
      });
    }

    // Player name doesn't exist, create a new player
    const newPlayerId = uuidv4();
    const canonicalPlayerName = playerName.trim(); // Use the trimmed original casing for storage

    await redis.multi()
      .hset(`${playersKeyPrefix}${newPlayerId}`, 'name', canonicalPlayerName)
      .set(`${playerNameToIdKeyPrefix}${normalizedPlayerName}`, newPlayerId)
      .exec();

    console.log(`[API register-player] New player '${canonicalPlayerName}' registered with ID: ${newPlayerId}`);
    return response.status(201).json({ 
      playerId: newPlayerId, 
      playerName: canonicalPlayerName 
    });

  } catch (error: any) {
    console.error(`[API register-player] Error during player registration for '${playerName}':`, error.message, error.stack);
    return response.status(500).json({ message: 'Error registering player.', error: error.message });
  }
} 