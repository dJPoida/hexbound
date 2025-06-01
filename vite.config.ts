import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read package.json to get the version
const packageJsonPath = resolve(__dirname, 'package.json');
console.log(`[vite.config.ts] Reading package.json from: ${packageJsonPath}`);
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const productionAppVersion = packageJson.version;
console.log(`[vite.config.ts] Detected productionAppVersion: ${productionAppVersion}`);

// Determine app version based on environment
// VERCEL_ENV is set by Vercel. 'development' is typically for vercel dev.
const isDevelopment = process.env.VERCEL_ENV === 'development';
const appVersion = isDevelopment 
  ? new Date().getTime().toString() 
  : productionAppVersion;

console.log(`[vite.config.ts] VERCEL_ENV: ${process.env.VERCEL_ENV}`);
console.log(`[vite.config.ts] Using appVersion: ${appVersion} (isDevelopment: ${isDevelopment})`);

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}); 