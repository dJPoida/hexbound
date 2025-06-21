import { authService } from './auth.service';
import { SocketMessage, ErrorPayload } from '../../shared/types/socket.types';

type MessageHandler = (payload: unknown) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;

class SocketService {
  private socket: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler[]>();
  private statusHandlers: StatusHandler[] = [];
  private reconnectAttempts = 0;
  private lastGameId: string | null = null;
  private isManuallyClosed = false;
  private messageQueue: string[] = [];

  private RECONNECT_BASE_DELAY = 1000; // 1s
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

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws?token=${token}`;
    
    this.socket = new WebSocket(socketUrl);

    this.socket.onopen = () => {
      console.log('[SocketService] WebSocket connection established.');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      // Automatically subscribe to the game once connected
      this.sendMessage('game:subscribe', { gameId: this.lastGameId });
    };

    this.socket.onmessage = (event) => {
      try {
        const message: SocketMessage<unknown> = JSON.parse(event.data);
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
      console.log(`[SocketService] WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
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

  private scheduleReconnect() {
    const delay = Math.min(this.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY);
    console.log(`[SocketService] Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts + 1})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      if (this.lastGameId) {
        this.connect(this.lastGameId);
      }
    }, delay);
  }

  public sendMessage<T>(type: string, payload: T) {
    const message = JSON.stringify({ type, payload });
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.log(`[SocketService] Socket not open, readyState: ${this.socket?.readyState}. Queuing message:`, message);
      this.messageQueue.push(message);
    }
  }
  
  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        console.log('[SocketService] Sending queued message:', message);
        this.socket?.send(message);
      }
    }
  }

  public on<T>(type: string, handler: (payload: T) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler as MessageHandler);
  }

  public off<T>(type: string, handler: (payload: T) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler as MessageHandler);
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
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const socketService = new SocketService(); 