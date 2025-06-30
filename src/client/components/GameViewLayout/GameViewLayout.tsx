import { h } from 'preact';
import { GameHeader } from '../Header/GameHeader';
import { Viewport } from '../Viewport/Viewport';
import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import styles from './GameViewLayout.module.css';

interface GameViewLayoutProps {
  header: h.JSX.Element;
  main: h.JSX.Element | null;
  footer: h.JSX.Element | null;
  gameState: ClientGameStatePayload;
  isMapReady: boolean;
  onReady?: () => void;
  onLogout: () => void;
  onNavigateToLobby: () => void;
  onToggleCounterDialog: () => void;
  onOpenSettings: () => void;
}

export function GameViewLayout({ header, main, footer, gameState, isMapReady, onReady, onLogout, onNavigateToLobby, onToggleCounterDialog, onOpenSettings }: GameViewLayoutProps) {
  return (
    <div class={styles.gameLayout}>
      {<div className={`${styles.fadeOverlay} ${isMapReady ? styles.fadeOut : ''}`}></div>}
      <div class={styles.viewportContainer}>
        <Viewport 
            pixiContainerId="pixi-container" 
            mapData={gameState.mapData} 
            gameId={gameState.gameId} 
            onReady={onReady} 
        />
      </div>
      <header class={styles.header}>{header}</header>
      <main class={styles.mainContent}>
        {main}
      </main>
      {footer && <footer class={styles.footer}>{footer}</footer>}
    </div>
  );
} 