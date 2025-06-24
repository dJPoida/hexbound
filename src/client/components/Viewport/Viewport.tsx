import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport, IViewportOptions } from 'pixi-viewport';
import { MapData } from '../../../shared/types/game.types';
import { MapRenderer } from '../../rendering/MapRenderer';
import { HEX_HEIGHT, HEX_WIDTH, MAX_TILES_ON_SCREEN, MIN_TILES_ON_SCREEN } from '../../../shared/constants/map.const';

interface ViewportProps {
  pixiContainerId: string;
  mapData: MapData | null;
}

export function Viewport({ pixiContainerId, mapData }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<PixiViewport | null>(null);
  const mapRendererRef = useRef<MapRenderer | null>(null);

  useEffect(() => {
    const calculateZoomLimits = (width: number, height: number) => {
      const screenArea = width * height;
      const tileArea = HEX_WIDTH * HEX_HEIGHT;
      
      const minScale = Math.sqrt(screenArea / (MAX_TILES_ON_SCREEN * tileArea));
      const maxScale = Math.sqrt(screenArea / (MIN_TILES_ON_SCREEN * tileArea));
      
      return { minScale, maxScale };
    };
    
    let resizeObserver: ResizeObserver;
    
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
        viewportRef.current = viewport;

        app.stage.addChild(viewport);

        const initialZoomLimits = calculateZoomLimits(
          pixiContainerRef.current.clientWidth,
          pixiContainerRef.current.clientHeight
        );

        // Activate basic interaction plugins
        viewport
          .drag()
          .pinch()
          .wheel()
          .decelerate()
          .clamp({ direction: 'y' })
          .clampZoom(initialZoomLimits);
        
        // Append the Pixi canvas to the container
        pixiContainerRef.current.appendChild(app.canvas);

        // Create and use the MapRenderer
        const mapRenderer = new MapRenderer(app, mapData);
        mapRendererRef.current = mapRenderer;
        await mapRenderer.loadAssets();
        
        // Add the map container to the viewport
        viewport.addChild(mapRenderer.stage);
        
        // Create all the tile objects once and cache them
        mapRenderer.initializeMap();

        // Move camera to the center of the middle map
        viewport.moveCenter(singleMapWidth * 1.5, worldHeight / 2);

        // Set initial zoom and trigger first render
        viewport.setZoom(initialZoomLimits.minScale, true);
        mapRenderer.render(viewport);

        const handleMove = () => {
          if (!viewportRef.current || !mapRendererRef.current) return;
          
          // Handle horizontal wrapping by keeping the viewport's center on the "treadmill"
          if (viewport.center.x < singleMapWidth) {
            viewport.off('moved', handleMove);
            viewport.moveCenter(viewport.center.x + singleMapWidth, viewport.center.y);
            viewport.on('moved', handleMove);
          } else if (viewport.center.x > singleMapWidth * 2) {
            viewport.off('moved', handleMove);
            viewport.moveCenter(viewport.center.x - singleMapWidth, viewport.center.y);
            viewport.on('moved', handleMove);
          }
          
          mapRenderer.render(viewport);
        };

        // Re-render on move
        viewport.on('moved', handleMove);
        
        // Use ResizeObserver to update zoom limits on container resize
        resizeObserver = new ResizeObserver(entries => {
          if (!viewportRef.current || !mapRendererRef.current) return;

          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            const newLimits = calculateZoomLimits(width, height);
            viewportRef.current.clampZoom(newLimits);
            viewportRef.current.resize(width, height);
            mapRendererRef.current.render(viewportRef.current);
          }
        });

        resizeObserver.observe(pixiContainerRef.current);
      }
    };

    initPixi();

    // Cleanup on component unmount
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [mapData]);

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
} 