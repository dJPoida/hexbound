import { h, ComponentChildren } from 'preact';
import htm from 'htm';
import styles from './Viewport.module.css';
import { useEffect, useRef } from 'preact/hooks';
import * as PIXI from 'pixi.js';

const html = htm.bind(h);

interface ViewportProps {
  children: ComponentChildren;
  pixiContainerId: string;
}

export function Viewport({ children, pixiContainerId }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (pixiAppRef.current) {
      // Already initialized
      return;
    }

    if (pixiContainerRef.current) {
      const app = new PIXI.Application();
      pixiAppRef.current = app;

      (async () => {
        await app.init({
          resizeTo: pixiContainerRef.current,
          backgroundColor: 0x1099bb,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });
        
        if (pixiContainerRef.current) {
          pixiContainerRef.current.appendChild(app.canvas);

          // Simple graphic to test
          const graphics = new PIXI.Graphics();
          graphics.rect(50, 50, 100, 100);
          graphics.fill(0xDE3249);
          app.stage.addChild(graphics);
        }
      })();
    }

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, true);
        pixiAppRef.current = null;
      }
    };
  }, []);

  return html`
    <div class=${styles.viewport}>
      <div id=${pixiContainerId} ref=${pixiContainerRef} class=${styles.pixiContainer}></div>
      <div class=${styles.uiContainer}>
        ${children}
      </div>
    </div>
  `;
} 