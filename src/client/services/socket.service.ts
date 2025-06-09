import { authService } from './auth.service';
import { SocketMessage } from '../../shared/types/socket.types';

type MessageHandler = (payload: unknown) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler[]>();

  public connect(gameId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

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
      // Automatically subscribe to the game once connected
      this.sendMessage('game:subscribe', { gameId });
    };

    this.socket.onmessage = (event) => {
      try {
        const message: SocketMessage<unknown> = JSON.parse(event.data);
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
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error('[SocketService] WebSocket error:', error);
    };
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

  public disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Export a singleton instance of the service
export const socketService = new SocketService(); 