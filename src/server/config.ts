import dotenv from 'dotenv';
import path from 'path';

import { getModuleDir } from '../shared/helpers/getModuleDir.helper.js';

const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined
);

dotenv.config({ path: path.resolve(currentModuleDirname, '../../.env.local') });

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3000', // Express server port, ensure it matches if changed
  viteDevPort: process.env.VITE_DEV_PORT || '3000', // Vite dev server port from before
  viteDevHost: process.env.VITE_DEV_SERVER_HOST || 'localhost', // Vite dev server host
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
  map: {
    defaultWidth: parseInt(process.env.MAP_WIDTH || '100', 10),
    defaultHeight: parseInt(process.env.MAP_HEIGHT || '30', 10),
  },
  webpush: {
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@localhost.com',
    publicKey: process.env.VITE_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
  appVersion: process.env.npm_package_version || 'unknown',
};

// Validate essential configuration
if (!config.webpush.publicKey || !config.webpush.privateKey) {
  const message =
    'VAPID keys (VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) are not defined in the environment. Push notifications will not work.';
  if (config.nodeEnv === 'production') {
    console.error(`[FATAL] ${message} Server shutting down.`);
    process.exit(1);
  } else {
    console.warn(`[WARNING] ${message}`);
  }
}

export default config;
