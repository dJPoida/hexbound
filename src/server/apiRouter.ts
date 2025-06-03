import express from 'express';
import config from './config';
import redisClient from './redisClient';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware to parse JSON bodies, will be applied to all routes in this router
router.use(express.json());

// Version endpoint
router.get('/version', (_req, res) => {
  res.json({ version: config.appVersion });
});

// Ping endpoint
router.get('/ping', (_req, res) => {
  res.json({ message: 'pong' });
});

// Redis test endpoint
router.get('/redis-test', async (_req, res) => {
  if (!redisClient.isOpen) {
    return res.status(503).json({ message: 'Redis client not connected' });
  }
  try {
    await redisClient.set('test_key', 'Hello from Hexbound via Redis!');
    const value = await redisClient.get('test_key');
    await redisClient.del('test_key'); // Clean up test key
    res.json({ message: 'Redis SET/GET successful', value });
  } catch (error) {
    console.error('[API /redis-test] Error:', error);
    res.status(500).json({ message: 'Error interacting with Redis', error: (error as Error).message });
  }
});

// Player Authentication/Registration Endpoint
router.post('/player/auth', async (req, res) => {
  const { playerName } = req.body;

  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    return res.status(400).json({ message: 'Player name is required and must be a non-empty string.' });
  }

  if (!redisClient.isOpen) {
    return res.status(503).json({ message: 'Redis client not connected. Cannot process player authentication.' });
  }

  try {
    const playerId = uuidv4();
    const redisKey = `${config.nodeEnv}:player:${playerId}`;
    const playerData = {
      playerId,
      playerName: playerName.trim(),
      joinedAt: new Date().toISOString(),
    };

    // Using HSET for structured data is often better, but SET with JSON.stringify is fine for this scope.
    await redisClient.set(redisKey, JSON.stringify(playerData));
    // Optionally, set an expiration if sessions/players are temporary, e.g.:
    // await redisClient.expire(redisKey, 60 * 60 * 24); // Expires in 24 hours

    console.log(`[Auth] Player registered/authenticated: ${playerName}, ID: ${playerId}`);
    res.status(200).json({ playerId, playerName: playerData.playerName });

  } catch (error) {
    console.error('[API /player/auth] Error:', error);
    res.status(500).json({ message: 'Error processing player authentication', error: (error as Error).message });
  }
});

export default router; 