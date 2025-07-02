import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import { authService } from '../../services/auth.service';

import { Dialog } from '../Dialog/Dialog';
import styles from './GameContainer.module.css';
import { useEffect } from 'preact/hooks';
import { socketService } from '../../services/socket.service';
import { SOCKET_MESSAGE_TYPES } from '../../../shared/constants/socket.const';

interface GameContainerProps {
  gameId: string;
  gameState: ClientGameStatePayload | null;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

export function GameContainer({ 
  gameId,
  gameState,
  connectionStatus,
}: GameContainerProps) {

  useEffect(() => {
    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'click', 'keydown', 'touchstart'];

    const sendAlivePingOnce = () => {
      console.log("[Activity] User is active, sending ping.");
      socketService.sendMessage(SOCKET_MESSAGE_TYPES.USER_ALIVE_PING, {});
      // Remove all listeners after the first event to only send the ping once.
      activityEvents.forEach(event => {
        window.removeEventListener(event, sendAlivePingOnce);
      });
    };

    if (gameState?.currentPlayerId === authService.getSession()?.userId) {
      console.log("[Activity] It's my turn, adding activity listeners.");
      activityEvents.forEach(event => {
        window.addEventListener(event, sendAlivePingOnce);
      });
    }

    // Cleanup function to remove listeners when the turn ends or component unmounts
    return () => {
      // console.log("[Activity] Turn ended or component unmounted, removing listeners.");
      activityEvents.forEach(event => {
        window.removeEventListener(event, sendAlivePingOnce);
      });
    };
  }, [gameState?.currentPlayerId]);

  useEffect(() => {
    // Handler for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Visibility] Page is visible. Sending active ping.');
        socketService.sendMessage(SOCKET_MESSAGE_TYPES.CLIENT_GAME_VIEW_ACTIVE, { gameId });
      } else {
        console.log('[Visibility] Page is hidden. Sending inactive ping.');
        socketService.sendMessage(SOCKET_MESSAGE_TYPES.CLIENT_GAME_VIEW_INACTIVE, { gameId });
      }
    };
    
    // Initial active message and event listener setup
    console.log('[Visibility] GameContainer mounted. Sending active ping.');
    socketService.sendMessage(SOCKET_MESSAGE_TYPES.CLIENT_GAME_VIEW_ACTIVE, { gameId });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      console.log('[Visibility] GameContainer unmounting. Sending inactive ping.');
      socketService.sendMessage(SOCKET_MESSAGE_TYPES.CLIENT_GAME_VIEW_INACTIVE, { gameId });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameId]);

  if (connectionStatus === 'connecting') {
    return <Dialog title="Connecting...">Connecting to Game...</Dialog>;
  }

  if (connectionStatus === 'reconnecting') {
    return <Dialog title="Reconnecting...">Connection to the server has been lost. Attempting to reconnect...</Dialog>;
  }

  if (connectionStatus === 'disconnected' && !gameState) {
     return <Dialog title="Disconnected">There is no active connection to the game server.</Dialog>;
  }

  return null; // GameContainer no longer renders a dialog directly
} 