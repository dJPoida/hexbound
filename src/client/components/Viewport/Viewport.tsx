import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport, IViewportOptions } from 'pixi-viewport';
import { MapData } from '../../../shared/types/game.types';
import { MapRenderer } from '../../rendering/MapRenderer';
import { HEX_HEIGHT, HEX_WIDTH, VIEWPORT_MAX_HEXES_VISIBLE, VIEWPORT_MIN_HEXES_VISIBLE } from '../../../shared/constants/map.const';

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

        // Calculate world dimensions based on new asset sizes
        const singleMapWidth = mapData.width * HEX_WIDTH * 0.75;
        const worldWidth = singleMapWidth * 3;
        const worldHeight = mapData.height * HEX_HEIGHT;

        // Create and attach the viewport
        const viewport = new PixiViewport({
          screenWidth: pixiContainerRef.current.clientWidth,
          screenHeight: pixiContainerRef.current.clientHeight,
          worldWidth,
          worldHeight,
          events: app.renderer.events,
        } as IViewportOptions);

        app.stage.addChild(viewport);

        // Activate basic interaction plugins
        viewport
          .drag()
          .pinch()
          .wheel()
          .decelerate()
          .clamp({ direction: 'y' })
          .clampZoom({
            minScale: pixiContainerRef.current.clientWidth / (VIEWPORT_MAX_HEXES_VISIBLE * HEX_WIDTH * 0.75),
            maxScale: pixiContainerRef.current.clientWidth / (VIEWPORT_MIN_HEXES_VISIBLE * HEX_WIDTH * 0.75),
          });
        
        // Append the Pixi canvas to the container
        pixiContainerRef.current.appendChild(app.canvas);

        // Create and use the MapRenderer
        const mapRenderer = new MapRenderer(app, mapData);
        await mapRenderer.loadAssets();
        
        // Add the map container to the viewport
        viewport.addChild(mapRenderer.stage);
        
        // Create all the tile objects once and cache them
        mapRenderer.initializeMap();

        // Move camera to the center of the middle map
        viewport.moveCenter(singleMapWidth * 1.5, worldHeight / 2);

        // Set initial zoom and trigger first render
        viewport.setZoom(0.1, true);
        mapRenderer.render(viewport);

        const handleMove = () => {
          // Handle horizontal wrapping by keeping the viewport's center on the "treadmill"
          if (viewport.center.x < singleMapWidth) {
            viewport.off('moved', handleMove);
            console.log(`[Wrap] Player panned left. Moving from ${viewport.center.x.toFixed(2)}...`);
            viewport.moveCenter(viewport.center.x + singleMapWidth, viewport.center.y);
            console.log(`...to ${viewport.center.x.toFixed(2)}`);
            viewport.on('moved', handleMove);
          } else if (viewport.center.x > singleMapWidth * 2) {
            viewport.off('moved', handleMove);
            console.log(`[Wrap] Player panned right. Moving from ${viewport.center.x.toFixed(2)}...`);
            viewport.moveCenter(viewport.center.x - singleMapWidth, viewport.center.y);
            console.log(`...to ${viewport.center.x.toFixed(2)}`);
            viewport.on('moved', handleMove);
          }
          
          mapRenderer.render(viewport);
        };

        // Re-render on move
        viewport.on('moved', handleMove);
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