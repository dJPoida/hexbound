import { Request, Response } from 'express';

import config from '../config';
import redisClient from '../redisClient';

export const getVersion = (_req: Request, res: Response) => {
  res.json({ version: config.appVersion });
};

export const getPing = (_req: Request, res: Response) => {
  res.json({ message: 'pong' });
};

export const testRedis = async (_req: Request, res: Response) => {
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
}; 