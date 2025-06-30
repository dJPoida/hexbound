import { h, ComponentChild } from 'preact';
import styles from './GameLayout.module.css';
import { Viewport } from '../Viewport/Viewport';
import { ClientGameStatePayload } from '../../../shared/types/socket.types';

interface GameLayoutProps {
  header: ComponentChild;
  main: ComponentChild | null;
  footer: ComponentChild | null;
  gameState: ClientGameStatePayload | null;
  isMapReady: boolean;
  onReady?: () => void;
}

export function GameLayout({ header, main, footer, gameState, isMapReady, onReady }: GameLayoutProps) {
  // Determine if the game view is active
  const isGameView = !!gameState;

  return (
    <div class={styles.gameLayout}>
      {isGameView && <div className={`${styles.fadeOverlay} ${isMapReady ? styles.fadeOut : ''}`}></div>}
      <div class={styles.viewportContainer}>
        {isGameView && <Viewport pixiContainerId="pixi-container" mapData={gameState.mapData} gameId={gameState.gameId} onReady={onReady} />}
      </div>
      <header class={styles.header}>{header}</header>
      <main class={styles.mainContent}>
        {main}
      </main>
      {footer && <footer class={styles.footer}>{footer}</footer>}
    </div>
  );
} 