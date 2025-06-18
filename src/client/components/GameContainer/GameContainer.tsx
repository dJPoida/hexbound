import { useState } from 'preact/hooks';
import { GameStateUpdatePayload } from '../../../shared/types/socket.types';
import { Button } from '../Button/Button';
import styles from './GameContainer.module.css';

interface GameContainerProps {
  gameState: GameStateUpdatePayload | null;
  onIncrementCounter: () => void;
  onEndTurn: () => void;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

export function GameContainer({ 
  gameState,
  onIncrementCounter,
  onEndTurn,
  connectionStatus
}: GameContainerProps) {
  const [isDebugVisible, setIsDebugVisible] = useState(false);

  if (connectionStatus === 'connecting') {
    return (
      <div className={styles.gameContainer}>
        <h3 className={styles.sectionTitle}>Connecting to Game...</h3>
        <p>Please wait while we establish a connection to the game server.</p>
      </div>
    );
  }

  if (connectionStatus === 'reconnecting') {
    return (
      <div className={styles.gameContainer}>
        <h3 className={styles.sectionTitle}>Connection Lost</h3>
        <p>Attempting to reconnect to the game server...</p>
      </div>
    );
  }

  if (connectionStatus === 'disconnected' && !gameState) {
     return (
      <div className={styles.gameContainer}>
        <h3 className={styles.sectionTitle}>Not Connected</h3>
        <p>There is no active connection to the game server.</p>
      </div>
    );
  }

  const handleToggleDebug = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  const gameCode = gameState?.gameCode ?? 'Loading...';
  const playerNames = gameState?.players
    ? gameState.players.map(p => p.userName).join(', ')
    : 'Loading...';
  const currentTurn = gameState?.turn ?? '-';
  const counter = gameState?.gameState.placeholderCounter ?? 0;

  return (
    <div className={styles.gameContainer}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Game Info</h3>
        <div className={styles.gameMetaRow}><span>Game Code:</span> <strong>{gameCode}</strong></div>
        <div className={styles.gameMetaRow}><span>Players:</span> <strong>{playerNames}</strong></div>
        <div className={styles.gameMetaRow}><span>Current Turn:</span> <strong>{currentTurn}</strong></div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Actions</h3>
        <div className={styles.gameMetaRow}>
          <span>Counter:</span> 
          <strong>{counter}</strong>
        </div>
        <div className={styles.gameActionContainer}>
          <Button onClick={onIncrementCounter} variant="primary">Increment</Button>
          <Button onClick={onEndTurn} variant="secondary">End Turn</Button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Debug</h3>
        <Button onClick={handleToggleDebug} variant="secondary">
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
    </div>
  );
} 