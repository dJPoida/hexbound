import { getModuleDir } from '@/shared/helpers/getModuleDir.helper';
import dotenv from 'dotenv';
import path from 'path';

// The 'import.meta.url' argument is only available in ESM context.
// In a CJS context (like the production build), it will be undefined,
// and the helper will fall back to using __dirname.
const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
);

// Always load environment variables from .env.local.
// This allows for both local development and previewing the production build locally.
// In a true containerized environment (like Docker), the variables injected
// into the container's environment will take precedence over the values in this file,
// as dotenv does not override existing process.env variables.
dotenv.config({ path: path.resolve(currentModuleDirname, '../../.env.local') });

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
  webpush: {
    publicKey: process.env.VITE_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || '',
  },
  appVersion: process.env.npm_package_version || 'unknown',
};

// Validate essential configuration
if (!config.webpush.privateKey || !config.webpush.publicKey) {
  console.error("VAPID keys (VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) are not defined in the environment. Push notifications will not work.");
  // In a production environment, you might want to prevent the server from starting.
  // process.exit(1); 
}

export default config; 