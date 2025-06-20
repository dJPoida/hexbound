import { useState } from 'preact/hooks';
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
  const [isDebugVisible, setIsDebugVisible] = useState(false);

  if (connectionStatus === 'connecting') {
    return <Dialog title="Connecting...">Connecting to Game...</Dialog>;
  }

  if (connectionStatus === 'reconnecting') {
    return <Dialog title="Reconnecting...">Connection to the server has been lost. Attempting to reconnect...</Dialog>;
  }

  if (connectionStatus === 'disconnected' && !gameState) {
     return <Dialog title="Disconnected">There is no active connection to the game server.</Dialog>;
  }

  const handleToggleDebug = () => {
    setIsDebugVisible(!isDebugVisible);
  };

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

      <div className={styles.section}>
        <Button onClick={handleToggleDebug} variant="secondary" fullWidth={true}>
          {isDebugVisible ? 'Hide' : 'Show'} Debug Info
        </Button>
        {isDebugVisible && (
          <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#333', color: '#f0f0f0', border: '1px solid #555', padding: '10px', textAlign: 'left' }}>
            <h4>Current Game State (Client-Side View):</h4>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {gameState ? JSON.stringify(gameState, null, 2) : 'No game state received.'}
            </pre>
          </div>
        )}
      </div>
    </Dialog>
  );
} 