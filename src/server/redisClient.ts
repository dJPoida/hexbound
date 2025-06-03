import { createClient, RedisClientOptions } from 'redis';
import config from './config';

const redisOptions: RedisClientOptions = {};

if (config.redis.url) {
  redisOptions.url = config.redis.url;
} else {
  redisOptions.socket = {
    host: config.redis.host,
    port: config.redis.port,
  };
  if (config.redis.password) {
    redisOptions.password = config.redis.password;
  }
}

// Let TypeScript infer the client type
const redisClient = createClient(redisOptions);

redisClient.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Client connected successfully and ready to use.');
});

redisClient.on('reconnecting', () => {
  console.log('[Redis] Client is reconnecting...');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Client error:', err);
});

redisClient.on('end', () => {
  console.log('[Redis] Client connection ended.');
});

// Attempt to connect to Redis as soon as this module is loaded.
// The connect() method returns a Promise, so we use an IIFE to handle it.
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[Redis] Failed to connect on startup:', err);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Redis] SIGINT received, disconnecting Redis client...');
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Redis] SIGTERM received, disconnecting Redis client...');
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(0);
});

export default redisClient; 