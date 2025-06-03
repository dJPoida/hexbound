import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config'; // Import shared configuration
// import redisClient from './redisClient'; // No longer directly used here, but used by apiRouter
import apiRouter from './apiRouter'; // Import the new API router

// App version is now in config, no need to import directly from package.json here
// import { version as appVersion } from '../../package.json'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`Hexbound Server starting, version: ${config.appVersion}`);

async function startServer() {
  const app = express();

  // Handle API routes first
  app.use('/api', apiRouter);

  // Vite Server Middleware for client-side assets and HMR
  // This needs to be after API routes to avoid conflicts, but before SPA fallback.
  const viteRoot = path.resolve(__dirname, '../client');
  const vite = await createViteServer({
    root: viteRoot,
    configFile: path.resolve(__dirname, '../../vite.config.ts'),
    server: { 
      middlewareMode: true,
      hmr: true,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  // SPA fallback: Serve index.html for all other GET requests
  // This should be the last route handler for GET requests.
  app.get('*', (req, res, next) => {
    // Let Vite handle its specific files like HMR updates or source maps
    if (req.originalUrl.includes('@vite') || req.originalUrl.includes('@fs')) {
        return next(); // Let Vite handle its own internal requests
    }
    // For any other GET request, serve the index.html
    res.sendFile(path.resolve(viteRoot, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).end();
      }
    });
  });

  // Use port from config
  const port = parseInt(config.viteDevPort, 10); // Vite integrated server runs on this
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log('Vite middleware enabled. Client should be served with HMR.');
  });
}

startServer().catch(err => {
  console.error("[Server] Failed to start server:", err);
  process.exit(1);
}); 