import express from 'express';
import http from 'http';
import { ViteDevServer } from 'vite';
import { WebSocketServer } from 'ws';

import config from './config.js';
import { AppDataSource, initializeDataSource } from './data-source.js';
import { configureExpressApp } from './expressApp.js';
import { disconnectRedis } from './redisClient.js';
import { initializeWebSocketServer } from './webSocketServer.js';

export class Server {
  private httpServer: http.Server;
  private wss: WebSocketServer | undefined;
  private vite: ViteDevServer | undefined;
  private app: express.Express;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
  }

  public async start(): Promise<void> {
    console.log(`Hexbound Server starting, version: ${config.appVersion}, mode: ${config.nodeEnv}`);

    // Initialize TypeORM by calling our new function
    try {
      await initializeDataSource();
      console.log('Data Source has been initialized!');
    } catch (err) {
      console.error('Error during Data Source initialization:', err);
      // Propagate the error to be handled by the caller in main.ts
      throw err;
    }

    const { vite } = await configureExpressApp(this.app, this.httpServer);
    this.vite = vite;

    // Initialize WebSocket Server
    this.wss = initializeWebSocketServer(this.httpServer);

    const port =
      config.nodeEnv === 'production'
        ? parseInt(config.port, 10)
        : parseInt(config.viteDevPort, 10);

    console.log(`[Server.ts] config.nodeEnv: ${config.nodeEnv}`);
    console.log(`[Server.ts] config.port: ${config.port}`);
    console.log(`[Server.ts] config.viteDevPort: ${config.viteDevPort}`);
    console.log(`[Server.ts] Final port selected: ${port}`);

    await new Promise<void>(resolve => {
      this.httpServer.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
        if (config.nodeEnv !== 'production') {
          console.log('Vite middleware enabled. Client should be served with HMR.');
        } else {
          console.log('Production server running. Serving static client build.');
        }
        resolve();
      });
    });
  }

  public async stop(signal: string): Promise<number> {
    console.log(`[Server] Executing graceful shutdown for ${signal}...`);
    console.trace('[Server] Shutdown initiated from:');
    let exitCode = 0;
    try {
      // 1. Close the Vite Dev Server to release its resources.
      if (this.vite) {
        await this.vite.close();
        console.log('[Server] Vite dev server closed.');
      }

      // 2. Forcefully close all WebSocket connections
      if (this.wss) {
        console.log('[Server] Closing all WebSocket connections...');
        for (const ws of this.wss.clients) {
          ws.terminate();
        }
        // 3. Close the WebSocket server itself
        await new Promise<void>(resolve => {
          this.wss?.close(err => {
            if (err) {
              console.error('[Server] Error closing WebSocket server:', err);
              // Don't reject, just log and continue shutdown
            }
            console.log('[Server] WebSocket server closed.');
            resolve();
          });
        });
      }

      // 4. Stop the HTTP server from accepting new connections
      if (this.httpServer) {
        await new Promise<void>((resolve, reject) => {
          this.httpServer.close((err?: NodeJS.ErrnoException) => {
            if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
              console.error('[Server] Error closing HTTP server:', err);
              exitCode = 1;
              return reject(err);
            }
            console.log('[Server] HTTP server closed.');
            resolve();
          });
        });
      }
      // 5. Disconnect from Redis
      await disconnectRedis();

      // 6. Disconnect from Postgres, checking if it was initialized
      if (AppDataSource && AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('[Server] PostgreSQL connection closed.');
      }
    } catch (error) {
      console.error('[Server] Error during graceful shutdown:', error);
      exitCode = 1;
    }
    console.log('[Server] Graceful shutdown complete.');
    return exitCode;
  }
}
