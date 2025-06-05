import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3000', // Express server port, ensure it matches if changed
  viteDevPort: process.env.VITE_DEV_PORT || '3000', // Vite dev server port from before
  redis: {
    url: process.env.REDIS_URL, // Preferred if you have a full URL
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  appVersion: process.env.npm_package_version || 'unknown',
};

export default config; 