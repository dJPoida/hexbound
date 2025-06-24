import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport } from 'pixi-viewport';
import { MapData } from '../../../shared/types/game.types';
import { MapRenderer } from '../../rendering/MapRenderer';

interface ViewportProps {
  pixiContainerId: string;
  mapData: MapData | null;
}

export function Viewport({ pixiContainerId, mapData }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    const initPixi = async () => {
      if (pixiContainerRef.current && mapData && !appRef.current) {
        // Create Pixi Application
        const app = new PIXI.Application();
        appRef.current = app;

        // Initialize the application
        await app.init({
          background: '#1a1a1a',
          resizeTo: pixiContainerRef.current,
        });

        // Create and attach the viewport
        const viewport = new PixiViewport({
          screenWidth: pixiContainerRef.current.clientWidth,
          screenHeight: pixiContainerRef.current.clientHeight,
          events: app.renderer.events,
          // worldWidth and worldHeight can be set if you want boundaries
        });

        app.stage.addChild(viewport);

        // Activate plugins
        viewport.drag().pinch().wheel().decelerate();

        // Append the Pixi canvas to the container
        pixiContainerRef.current.appendChild(app.canvas);

        // Create and use the MapRenderer
        const mapRenderer = new MapRenderer(app, mapData);
        await mapRenderer.loadAssets();
        
        // Add the map container to the viewport
        viewport.addChild(mapRenderer.stage);

        mapRenderer.render();
      }
    };

    initPixi();

    // Cleanup on component unmount
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [mapData]); // Rerun effect if mapData changes

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
} 