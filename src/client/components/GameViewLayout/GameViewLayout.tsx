import { h } from 'preact';
import { GameHeader } from '../Header/GameHeader';
import { Viewport } from '../Viewport/Viewport';
import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import styles from './GameViewLayout.module.css';
import { ActionBar } from '../ActionBar/ActionBar';
import { OldButton } from '../OldButton/OldButton';

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
  dialog
}: GameViewLayoutProps) {
  
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
      <OldButton onClick={() => onPushDialog('debugInfo')} variant="icon" aria-label="Show Debug Info">
        <i class="hbi hbi-terminal"></i>
      </OldButton>
      <OldButton onClick={onEndTurn} variant="secondary" disabled={!isMyTurn}>End Turn</OldButton>
    </ActionBar>
  );
  
  return (
    <div class={styles.gameLayout}>
      <div className={`${styles.fadeOverlay} ${isMapReady ? styles.fadeOut : ''}`}></div>
      <div class={styles.viewportContainer}>
        <Viewport 
            pixiContainerId="pixi-container" 
            mapData={gameState.mapData} 
            gameId={gameState.gameId} 
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