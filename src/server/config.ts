import { getModuleDir } from '@/shared/helpers/getModuleDir.helper';
import dotenv from 'dotenv';
import path from 'path';

// Determine the environment
const isProduction = process.env.NODE_ENV === 'production';

// The 'import.meta.url' argument is only available in ESM context.
// In a CJS context (like the production build), it will be undefined,
// and the helper will fall back to using __dirname.
const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
);

// In production, variables are injected by Docker. In development, load from .env.local
if (!isProduction) {
  dotenv.config({ path: path.resolve(currentModuleDirname, '../../.env.local') });
}

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
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  appVersion: process.env.npm_package_version || 'unknown',
};

export default config; 