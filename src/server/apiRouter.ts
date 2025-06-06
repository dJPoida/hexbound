import express from 'express';
import config from './config';
import redisClient from './redisClient';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './data-source';
import { User } from './entities/User.entity';

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

// User Login/Registration Endpoint
router.post('/login', async (req, res) => {
  const { userName } = req.body;

  if (!userName || typeof userName !== 'string' || userName.trim().length === 0 || userName.length > 20) {
    return res.status(400).json({ message: 'Username is required, must be a non-empty string, and cannot exceed 20 characters.' });
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOneBy({ userName: userName.trim() });

    if (!user) {
      // User does not exist, so create a new one
      user = userRepository.create({ userName: userName.trim() });
      await userRepository.save(user);
      console.log(`[Login] New user created: ${user.userName}, ID: ${user.userId}`);
    } else {
      console.log(`[Login] Existing user logged in: ${user.userName}, ID: ${user.userId}`);
    }

    res.status(200).json({ userId: user.userId, userName: user.userName });

  } catch (error) {
    console.error('[API /login] Error:', error);
    res.status(500).json({ message: 'Error processing user login', error: (error as Error).message });
  }
});


export default router; 