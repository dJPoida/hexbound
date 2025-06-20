import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import { authService } from '../../services/auth.service';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './GameContainer.module.css';

interface GameContainerProps {
  gameState: ClientGameStatePayload | null;
  onIncrementCounter: () => void;
  onEndTurn: () => void;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  isMyTurn: boolean;
}

export function GameContainer({ 
  gameState,
  onIncrementCounter,
  onEndTurn,
  connectionStatus,
  isMyTurn
}: GameContainerProps) {

  if (connectionStatus === 'connecting') {
    return <Dialog title="Connecting...">Connecting to Game...</Dialog>;
  }

  if (connectionStatus === 'reconnecting') {
    return <Dialog title="Reconnecting...">Connection to the server has been lost. Attempting to reconnect...</Dialog>;
  }

  if (connectionStatus === 'disconnected' && !gameState) {
     return <Dialog title="Disconnected">There is no active connection to the game server.</Dialog>;
  }

  const gameCode = gameState?.gameCode ?? 'Loading...';
  const playerNames = gameState?.players
    ? gameState.players.map(p => p.userName).join(', ')
    : 'Loading...';
  const currentTurn = gameState?.turnNumber ?? '-';
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

  return (
    <Dialog title="Game Status">
      <div className={styles.section}>
        <div className={styles.gameMetaRow}><span>Game Code:</span> <strong>{gameCode}</strong></div>
        <div className={styles.gameMetaRow}><span>Players:</span> <strong>{playerNames}</strong></div>
        <div className={styles.gameMetaRow}><span>Current Turn:</span> <strong>{currentTurn}</strong></div>
      </div>

      <div className={styles.section}>
        {renderTurnStatus()}
      </div>

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