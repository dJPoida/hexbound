import { h, ComponentChild } from 'preact';
import styles from './GameLayout.module.css';
import { Viewport } from '../Viewport/Viewport';
import { ClientGameStatePayload } from '../../../shared/types/socket.types';

interface GameLayoutProps {
  header: ComponentChild;
  main: ComponentChild;
  footer: ComponentChild;
  gameState: ClientGameStatePayload | null;
}

export function GameLayout({ header, main, footer, gameState }: GameLayoutProps) {
  return (
    <div class={styles.gameLayout}>
      <header class={styles.header}>{header}</header>
      <main class={styles.mainContent}>{main}</main>
      <div class={styles.viewportContainer}>
        <Viewport
          pixiContainerId="pixi-container"
          mapData={gameState?.mapData || null}
        >
          {null}
        </Viewport>
      </div>
      <footer class={styles.footer}>{footer}</footer>
    </div>
  );
} 