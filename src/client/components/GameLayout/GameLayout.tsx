import { h, ComponentChild } from 'preact';
import styles from './GameLayout.module.css';
import { Viewport } from '../Viewport/Viewport';

interface GameLayoutProps {
  header: ComponentChild;
  main: ComponentChild;
  footer: ComponentChild;
}

export function GameLayout({ header, main, footer }: GameLayoutProps) {
  return (
    <div class={styles.gameLayout}>
      <div class={styles.viewportContainer}>
        <Viewport pixiContainerId="pixi-container">{null}</Viewport>
      </div>
      <header class={styles.header}>{header}</header>
      <main class={styles.mainContent}>{main}</main>
      <footer class={styles.footer}>{footer}</footer>
    </div>
  );
} 