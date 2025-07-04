import { h } from 'preact';
import { GameHeader } from '../Header/GameHeader';
import { Viewport } from '../Viewport/Viewport';
import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import styles from './GameViewLayout.module.css';
import { ActionBar } from '../ActionBar/ActionBar';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { settingsService } from '../../services/settings.service';
import { useState, useEffect } from 'preact/hooks';

type DialogType = 'gameSettings' | 'incrementCounter' | 'debugInfo';

interface GameViewLayoutProps {
  gameState: ClientGameStatePayload;
  isMapReady: boolean;
  onReady?: () => void;
  onLogout: () => void;
  onNavigateToLobby: () => void;
  onEndTurn: () => void;
  onPushDialog: (dialog: DialogType) => void;
  isMyTurn: boolean;
  currentUserName: string | null;
  currentUserId: string | null;
  dialog: h.JSX.Element | null;
}

export function GameViewLayout({ 
  gameState, 
  isMapReady, 
  onReady, 
  onLogout, 
  onNavigateToLobby, 
  onEndTurn,
  onPushDialog,
  isMyTurn,
  currentUserName,
  currentUserId,
  dialog
}: GameViewLayoutProps) {
  
  const [settings, setSettings] = useState(settingsService.getSettings());

  useEffect(() => {
    const unsubscribe = settingsService.subscribe(setSettings);
    return () => unsubscribe();
  }, []);
  
  // Check if any players are placeholders
  const hasPlaceholders = gameState.players.some(p => p.isPlaceholder);
  const canEndTurn = isMyTurn && !hasPlaceholders;
  
  const headerContent = (
    <GameHeader
      currentUserName={currentUserName}
      onLogout={onLogout}
      currentView='game'
      onNavigateToLobby={onNavigateToLobby}
      turnNumber={gameState.turnNumber}
      counter={gameState.gameState.placeholderCounter}
      onToggleCounterDialog={() => onPushDialog('incrementCounter')}
      onOpenSettings={() => onPushDialog('gameSettings')}
    />
  );

  const footerContent = (
    <ActionBar>
      <div>
        {settings.showDebugInfo && (
          <Button onClick={() => onPushDialog('debugInfo')} variant="icon" ariaLabel="Show Debug Info">
            <Icon name="terminal" color="light" />
          </Button>
        )}
      </div>
      <div>
        <Button 
          onClick={onEndTurn} 
          variant="primary" 
          disabled={!canEndTurn}
        >
          {hasPlaceholders ? 'Waiting for Players' : 'End Turn'}
        </Button>
      </div>
    </ActionBar>
  );
  
  return (
    <div class={styles.gameLayout}>
      <div className={`${styles.fadeOverlay} ${isMapReady ? styles.fadeOut : ''}`}></div>
      <div class={styles.viewportContainer}>
        <Viewport 
            pixiContainerId="pixi-container" 
            gameState={gameState} 
            currentPlayerId={currentUserId}
            onReady={onReady} 
        />
      </div>
      <header class={styles.header}>{headerContent}</header>
      <main class={styles.mainContent}>
        {dialog}
      </main>
      <footer class={styles.footer}>{footerContent}</footer>
    </div>
  );
} 