import { createClient, RedisClientOptions } from 'redis';

import config from './config';

const MAX_REDIS_RECONNECT_RETRIES = 10;
const INITIAL_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 5000;

const redisOptions: RedisClientOptions = {
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries >= MAX_REDIS_RECONNECT_RETRIES) {
        // Stop retrying and signal an error
        const err = new Error(
          `[Redis] Exhausted all ${MAX_REDIS_RECONNECT_RETRIES} reconnect retries.`
        );
        console.error(err.message);
        // Returning an Error tells the client to stop retrying and emit an 'error' event with this error.
        return err;
      }
      // Calculate delay with exponential backoff, capping at MAX_RECONNECT_DELAY_MS
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY_MS * Math.pow(2, retries),
        MAX_RECONNECT_DELAY_MS
      );
      console.log(
        `[Redis] Reconnect attempt ${retries + 1}/${MAX_REDIS_RECONNECT_RETRIES}, next attempt in ${delay}ms`
      );
      return delay;
    },
  },
};

if (config.redis.url) {
  redisOptions.url = config.redis.url;
} else {
  // Ensure socket options are merged if not using URL
  redisOptions.socket = {
    ...redisOptions.socket, // Preserve reconnectStrategy
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

// 'reconnecting' event might still be useful for general logging if the strategy returns a number
redisClient.on('reconnecting', () => {
  // This log might become redundant if the reconnectStrategy logs verbosely
  // console.log('[Redis] Client is attempting to reconnect...');
});

redisClient.on('error', err => {
  // The error from reconnectStrategy (when retries are exhausted) will also land here.
  console.error('[Redis] Client error:', err.message); // Log only message to avoid huge stack for connection errors
});

redisClient.on('end', () => {
  console.log('[Redis] Client connection ended.');
});

// Attempt to connect to Redis as soon as this module is loaded.
(async () => {
  try {
    await redisClient.connect();
  } catch (err: unknown) {
    // Changed from any to unknown
    // This initial connect error won't use the reconnectStrategy, it's a one-off attempt.
    // The strategy applies to disconnections *after* an initial successful connection, or if connect() is retried externally.
    // However, if connect() fails, the client will attempt to reconnect based on the strategy if it was already "connected" (which it wouldn't be here).
    // The error from createClient itself if options are bad, or from connect() if initial connection fails.
    if (err instanceof Error) {
      console.error('[Redis] Failed to connect on startup:', err.message);
    } else {
      console.error('[Redis] Failed to connect on startup with an unknown error type:', err);
    }
  }
})();

// Export a function to be called for graceful shutdown
export const disconnectRedis = async () => {
  console.log('[Redis] Disconnecting client...');
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log('[Redis] Client quit successfully.');
  } else {
    console.log('[Redis] Client was not open, no action needed.');
  }
};

export default redisClient;
