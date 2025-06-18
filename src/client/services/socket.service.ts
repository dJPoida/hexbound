import { authService } from './auth.service';
import { SocketMessage, ErrorPayload } from '../../shared/types/socket.types';

type MessageHandler = (payload: unknown) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;

class SocketService {
  private socket: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler[]>();
  private statusHandlers: StatusHandler[] = [];
  private heartbeatTimer: number | null = null;
  private missedPongs = 0;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private lastGameId: string | null = null;
  private isManuallyClosed = false;

  private HEARTBEAT_INTERVAL = 20000; // 20s
  private MAX_MISSED_PONGS = 2;
  private BASE_RECONNECT_DELAY = 3000; // 3s
  private MAX_RECONNECT_DELAY = 30000; // 30s

  private updateStatus(status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') {
    this.statusHandlers.forEach(handler => handler(status));
  }

  public connect(gameId: string) {
    this.lastGameId = gameId;
    this.isManuallyClosed = false;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    this.updateStatus('connecting');

    const token = authService.getToken();
    if (!token) {
      console.error('SocketService: No auth token found. Cannot connect.');
      return;
    }

    // Use wss:// for secure connections in production
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws?token=${token}`;
    
    this.socket = new WebSocket(socketUrl);

    this.socket.onopen = () => {
      console.log('[SocketService] WebSocket connection established.');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      // Automatically subscribe to the game once connected
      this.sendMessage('game:subscribe', { gameId: this.lastGameId });
    };

    this.socket.onmessage = (event) => {
      try {
        const message: SocketMessage<unknown> = JSON.parse(event.data);
        if (message.type === 'pong') {
          this.missedPongs = 0;
          return;
        }
        if (message.type === 'error') {
          const payload = message.payload as ErrorPayload;
          console.error(`[SocketService] Server Error: ${payload.message}`, payload.details ?? '');
          return;
        }
        if (this.messageHandlers.has(message.type)) {
          this.messageHandlers.get(message.type)?.forEach(handler => handler(message.payload));
        } else {
          console.warn(`[SocketService] No handler for message type: ${message.type}`);
        }
      } catch (error) {
        console.error('[SocketService] Error parsing message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`[SocketService] WebSocket connection closed: ${event.code}`);
      this.stopHeartbeat();
      this.socket = null;
      if (!this.isManuallyClosed) {
        this.updateStatus('reconnecting');
        this.scheduleReconnect();
      } else {
        this.updateStatus('disconnected');
      }
    };

    this.socket.onerror = (error) => {
      console.error('[SocketService] WebSocket error:', error);
      this.socket?.close();
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.missedPongs = 0;
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
        this.missedPongs++;
        if (this.missedPongs > this.MAX_MISSED_PONGS) {
          console.warn('[SocketService] Missed pong, closing socket to trigger reconnect.');
          this.socket.close();
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY);
    console.log(`[SocketService] Attempting to reconnect in ${delay / 1000}s...`);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      if (this.lastGameId) {
        this.connect(this.lastGameId);
      }
    }, delay);
  }

  public sendMessage<T>(type: string, payload: T) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: SocketMessage<T> = { type, payload };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('[SocketService] Cannot send message, socket is not open.');
    }
  }

  public on(messageType: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)?.push(handler);
  }

  public off(messageType: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler);
  }

  public offStatus(handler: StatusHandler) {
    const index = this.statusHandlers.indexOf(handler);
    if (index > -1) {
      this.statusHandlers.splice(index, 1);
    }
  }

  public disconnect() {
    this.isManuallyClosed = true;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Export a singleton instance of the service
export const socketService = new SocketService(); 