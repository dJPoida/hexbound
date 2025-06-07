import { WebSocketServer } from 'ws';
import http from 'http';
import { parse } from 'url';
import redisClient from './redisClient';
import { AuthenticatedWebSocket } from '../shared/types/socket.types';
import * as subManager from './socketSubscriptionManager';
import { handleSocketMessage } from './socketMessageHandlers';

export function initializeWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);

    // For now, only handle WebSocket connections on the /ws path
    if (pathname !== '/ws') {
      socket.destroy();
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

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log(`[WebSocket] Client connected with userId: ${ws.userId}`);

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

  console.log('[WebSocket] Server initialized and attached to HTTP server.');
  return wss;
} 