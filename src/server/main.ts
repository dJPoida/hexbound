import express from 'express';
import path from 'path';
import http from 'http'; // Import http module
import { fileURLToPath } from 'url'; // Needed for ESM dev mode
import config from './config';
import apiRouter from './apiRouter';
import { disconnectRedis } from './redisClient'; // Import disconnectRedis

// Vite is only needed for development mode
import { createServer as createViteServer } from 'vite';

let currentModuleDirname: string;

if (typeof __dirname === 'string' && __dirname) {
  // Environment provides a global __dirname (e.g., CJS bundle from esbuild)
  currentModuleDirname = __dirname;
} else if (typeof import.meta !== 'undefined' && import.meta.url) {
  // ESM environment (e.g., dev mode with tsx)
  currentModuleDirname = path.dirname(fileURLToPath(import.meta.url));
} else {
  // Fallback or error if neither is available
  console.error("CRITICAL: Could not determine module directory. __dirname and import.meta.url are unavailable.");
  process.exit(1);
}

console.log(`Hexbound Server starting, version: ${config.appVersion}, mode: ${config.nodeEnv}`);
console.log(`Using directory for operations: ${currentModuleDirname}`);

let httpServer: http.Server; // To store the server instance

async function startServer() {
  const app = express();

  // API routes are always active
  app.use('/api', apiRouter);

  if (config.nodeEnv === 'production') {
    console.log('Production mode: serving static files from dist/client');
    const clientBuildDir = path.resolve(currentModuleDirname, '../client');
    const assetsDir = path.resolve(clientBuildDir, 'assets');

    // Serve static assets (JS, CSS, images, etc.)
    app.use('/assets', express.static(assetsDir));

    // SPA fallback: Serve index.html for all other GET requests
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(clientBuildDir, 'index.html'), (err) => {
        if (err) {
          console.error('Error sending index.html in production:', err);
          res.status(500).end();
        }
      });
    });
  } else {
    console.log('Development mode: configuring Vite middleware.');
    const viteRoot = path.resolve(currentModuleDirname, '../client');
    const vite = await createViteServer({
      root: viteRoot,
      configFile: path.resolve(currentModuleDirname, '../../vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback for Vite dev server
    app.get('*', (req, res, next) => {
      if (req.originalUrl.includes('@vite') || req.originalUrl.includes('@fs') || req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(viteRoot, 'index.html'), (err) => {
        if (err) {
          console.error('Error sending index.html in dev:', err);
          res.status(500).end();
        }
      });
    });
  }

  const port = config.nodeEnv === 'production' 
    ? parseInt(config.port, 10) 
    : parseInt(config.viteDevPort, 10);

  // Store the server instance
  httpServer = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    if (config.nodeEnv !== 'production') {
      console.log('Vite middleware enabled. Client should be served with HMR.');
    } else {
      console.log('Production server running. Serving static client build.');
    }
  });
}

const gracefulShutdownHandler = async (signal: string) => {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);
  let exitCode = 0;
  try {
    // Stop the HTTP server from accepting new connections
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) {
            console.error('[Server] Error closing HTTP server:', err);
            exitCode = 1;
            return reject(err);
          }
          console.log('[Server] HTTP server closed.');
          resolve();
        });
      });
    }
    // Disconnect Redis
    await disconnectRedis();
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error);
    exitCode = 1;
  }
  console.log('[Server] Graceful shutdown complete. Exiting.');
  process.exit(exitCode);
};

process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));
process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));

startServer().catch(err => {
  console.error("[Server] Failed to start server:", err);
  process.exit(1);
}); 