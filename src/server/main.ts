import express from 'express';
import path from 'path';
import http from 'http'; // Import http module
import { getModuleDir } from '../shared/helpers/getModuleDir.helper.js';
import config from './config';
import apiRouter from './apiRouter';
import { disconnectRedis } from './redisClient'; // Import disconnectRedis
import { AppDataSource } from './data-source';
import { initializeWebSocketServer } from './webSocketServer.js';

// Vite is only needed for development mode
import { createServer as createViteServer } from 'vite';

// The 'import.meta.url' argument is only available in ESM context.
// In a CJS context (like the production build), it will be undefined,
// and the helper will fall back to using __dirname.
const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
);

console.log(`Hexbound Server starting, version: ${config.appVersion}, mode: ${config.nodeEnv}`);
console.log(`Using directory for operations: ${currentModuleDirname}`);

let moduleLevelHttpServer: http.Server; // To store the server instance

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app); // Create HTTP server instance with Express app

  // Initialize WebSocket Server
  initializeWebSocketServer(httpServer);

  // Initialize TypeORM
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  } catch (err) {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
  }

  // API routes are always active
  app.use('/api', apiRouter);

  if (config.nodeEnv === 'production') {
    console.log('Production mode: serving static files from dist/client');
    const clientBuildDir = path.resolve(currentModuleDirname, '../client');

    // Serve all static files from the client build directory
    app.use(express.static(clientBuildDir));

    // SPA fallback: Serve index.html for all other GET requests that don't match a file
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
        hmr: {
          server: httpServer, // Pass the http server instance here
        },
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

  console.log(`[main.ts] config.nodeEnv: ${config.nodeEnv}`);
  console.log(`[main.ts] config.prodPort (now config.port): ${config.port}`);
  console.log(`[main.ts] config.devPort (now config.viteDevPort): ${config.viteDevPort}`);

  // Select port based on environment using the new config keys
  const port = config.nodeEnv === 'production' 
    ? parseInt(config.port, 10)          // Use config.port for production
    : parseInt(config.viteDevPort, 10);   // Use config.viteDevPort for development
  
  console.log(`[main.ts] Final port selected: ${port}`);

  // Store the server instance - NO, httpServer is already our instance.
  // Start listening on the httpServer instance
  httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    if (config.nodeEnv !== 'production') {
      console.log('Vite middleware enabled. Client should be served with HMR.');
    } else {
      console.log('Production server running. Serving static client build.');
    }
  });

  moduleLevelHttpServer = httpServer; // Assign the created httpServer to the module-level variable
}

const gracefulShutdownHandler = async (signal: string) => {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);
  let exitCode = 0;
  try {
    // Stop the HTTP server from accepting new connections
    if (moduleLevelHttpServer) {
      await new Promise<void>((resolve, reject) => {
        moduleLevelHttpServer.close((err) => {
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
    // Disconnect from Postgres
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('[Server] PostgreSQL connection closed.');
    }
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