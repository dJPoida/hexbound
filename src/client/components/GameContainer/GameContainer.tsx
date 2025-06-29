import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import { authService } from '../../services/auth.service';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './GameContainer.module.css';
import { useEffect } from 'preact/hooks';
import { socketService } from '../../services/socket.service';
import { SOCKET_MESSAGE_TYPES } from '../../../shared/constants/socket.const';

interface GameContainerProps {
  gameId: string;
  gameState: ClientGameStatePayload | null;
  onIncrementCounter: () => void;
  onEndTurn: () => void;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  isMyTurn: boolean;
  isCounterDialogOpen: boolean;
  onToggleCounterDialog: () => void;
}

export function GameContainer({ 
  gameId,
  gameState,
  onIncrementCounter,
  onEndTurn,
  connectionStatus,
  isMyTurn,
  isCounterDialogOpen,
  onToggleCounterDialog
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

    if (isMyTurn) {
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
  }, [isMyTurn]);

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

  const counter = gameState?.gameState.placeholderCounter ?? 0;
  
  const currentPlayer = gameState?.players.find(
    (p) => p.userId === gameState.currentPlayerId
  );

  const renderTurnStatus = () => {
    if (!gameState) return null;

    if (isMyTurn) {
      return <div className={`${styles.turnStatus} ${styles.myTurn}`}>It&apos;s your turn!</div>;
    }

    if (currentPlayer) {
      return (
        <div className={`${styles.turnStatus} ${styles.waitingTurn}`}>
          Waiting for <strong>{currentPlayer.userName}</strong>...
        </div>
      );
    }
    return null;
  };

  if (!isCounterDialogOpen) {
    return null;
  }

  return (
    <Dialog title="Increment Counter" onClose={onToggleCounterDialog}>
      <div className={styles.section}>
        <div className={styles.gameMetaRow}>
          <span>Counter:</span> 
          <strong>{counter}</strong>
        </div>
        <Button onClick={onIncrementCounter} variant="primary" disabled={!isMyTurn} fullWidth={true}>Increment</Button>
      </div>
    </Dialog>
  );
} 