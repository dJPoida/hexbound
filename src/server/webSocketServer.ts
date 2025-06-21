import { WebSocketServer } from 'ws';
import http from 'http';
import { parse } from 'url';
import redisClient from './redisClient';
import { AuthenticatedWebSocket } from '../shared/types/socket.types';
import * as subManager from './socketSubscriptionManager';
import { handleSocketMessage } from './socketMessageHandlers';

// Extend the AuthenticatedWebSocket to include the isAlive flag for heartbeats
interface HeartbeatWebSocket extends AuthenticatedWebSocket {
  isAlive: boolean;
}

export function initializeWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);

    // We only want to handle our application's WebSocket requests on the '/ws' path.
    // By returning early for any other path, we allow other 'upgrade' listeners
    // (like the one Vite uses for HMR) to process the request.
    if (pathname !== '/ws') {
      return;
    }

    // Extract token from query parameter (or headers)
    const { query } = parse(request.url || '', true);
    const token = Array.isArray(query.token) ? query.token[0] : query.token;
    
    if (!token) {
      console.log('[WebSocket] Upgrade failed: No token provided.');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    try {
      const userId = await redisClient.get(`session:${token}`);
      if (!userId) {
        console.log('[WebSocket] Upgrade failed: Invalid token.');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // If authentication is successful, complete the WebSocket upgrade
      wss.handleUpgrade(request, socket, head, (ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        authWs.userId = userId; // Attach userId to the WebSocket connection
        wss.emit('connection', authWs, request);
      });
    } catch (error) {
        console.error('[WebSocket] Upgrade error:', error);
        socket.destroy();
    }
  });

  wss.on('connection', (ws: HeartbeatWebSocket) => {
    console.log(`[WebSocket] Client connected with userId: ${ws.userId}`);
    
    // Initialize heartbeat state for the new connection
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message: Buffer) => {
      handleSocketMessage(ws, message);
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client ${ws.userId} disconnected`);
      subManager.unsubscribeFromAll(ws); // Clean up subscriptions on disconnect
    });

    ws.on('error', (error: Error) => {
      console.error(`[WebSocket] Error for ${ws.userId}:`, error);
    });
  });

  // Set up the heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const hbWs = ws as HeartbeatWebSocket;
      if (!hbWs.isAlive) {
        console.log(`[WebSocket] Terminating inactive connection for user: ${hbWs.userId}`);
        return hbWs.terminate();
      }

      hbWs.isAlive = false;
      hbWs.ping(() => {}); // Send ping
    });
  }, 30000); // 30 seconds

  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[WebSocket] Server initialized and attached to HTTP server.');
  return wss;
} 