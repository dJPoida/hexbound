import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport, IViewportOptions } from 'pixi-viewport';
import { MapData } from '../../shared/types/game.types';
import { HEX_HEIGHT, HEX_WIDTH, MAX_TILES_ON_SCREEN, MIN_TILES_ON_SCREEN } from '../../shared/constants/map.const';
import { MapRenderer } from '../rendering/MapRenderer';

class RenderingService {
  private app: PIXI.Application | null = null;
  private viewport: PixiViewport | null = null;
  private mapRenderer: MapRenderer | null = null;
  private isInitialized: Promise<void> | null = null;
  private initializationResolver: (() => void) | null = null;

  public async initialize(containerElement: HTMLDivElement, mapData: MapData | null): Promise<void> {
    if (this.app || !mapData) {
      return this.isInitialized ?? Promise.resolve();
    }

    this.isInitialized = new Promise(resolve => {
      this.initializationResolver = resolve;
    });

    // --- Create Pixi Application ---
    const app = new PIXI.Application();
    this.app = app;
    await app.init({
      background: '#1a1a1a',
      resizeTo: containerElement,
    });
    containerElement.appendChild(app.canvas);

    // --- Create Viewport ---
    const singleMapWidth = mapData.width * HEX_WIDTH * 0.75;
    const worldWidth = singleMapWidth * 3;
    const trueWorldHeight = (mapData.height * HEX_HEIGHT) + (HEX_HEIGHT / 2);
    
    // Lie to the viewport about its height to create the bottom clamp effect
    const worldHeightForClamping = trueWorldHeight - (HEX_HEIGHT * 1.5);

    const viewport = new PixiViewport({
      screenWidth: containerElement.clientWidth,
      screenHeight: containerElement.clientHeight,
      worldWidth,
      worldHeight: worldHeightForClamping,
      events: app.renderer.events,
    } as IViewportOptions);
    this.viewport = viewport;
    app.stage.addChild(viewport);

    // --- Activate Plugins ---
    const initialZoomLimits = this.calculateZoomLimits(containerElement.clientWidth, containerElement.clientHeight);
    viewport
      .clamp({ direction: 'y' })
      .drag()
      .pinch()
      .wheel()
      .decelerate({ friction: 0.8 })
      .clampZoom(initialZoomLimits);

    // --- Initialize Map Renderer ---
    const mapRenderer = new MapRenderer(app, mapData);
    this.mapRenderer = mapRenderer;
    await mapRenderer.loadAssets();
    viewport.addChild(mapRenderer.stage);
    mapRenderer.initializeMap();

    // --- Set Initial Camera State ---
    viewport.moveCenter(singleMapWidth * 1.5, trueWorldHeight / 2);
    viewport.setZoom(initialZoomLimits.minScale, true);
    mapRenderer.render(viewport);

    // --- Attach Event Handlers ---
    const handleMove = () => {
      if (!this.viewport || !this.mapRenderer) return;
      
      if (this.viewport.center.x < singleMapWidth) {
        this.viewport.off('moved', handleMove);
        this.viewport.moveCenter(this.viewport.center.x + singleMapWidth, this.viewport.center.y);
        this.viewport.on('moved', handleMove);
      } else if (this.viewport.center.x > singleMapWidth * 2) {
        this.viewport.off('moved', handleMove);
        this.viewport.moveCenter(this.viewport.center.x - singleMapWidth, this.viewport.center.y);
        this.viewport.on('moved', handleMove);
      }
      this.mapRenderer.render(this.viewport);
    };
    viewport.on('moved', handleMove);

    if (this.initializationResolver) {
      this.initializationResolver();
    }
  }

  public async updateMap(newMapData: MapData): Promise<void> {
    if (!this.isInitialized) {
      // This can happen if updateMap is called before initialize (e.g., due to React lifecycle).
      // We wait for the initialization to complete before proceeding.
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to allow initialization to start
      if (!this.isInitialized) {
        console.warn('[RenderingService] Cannot update map, service is not initializing.');
        return;
      }
    }
    
    await this.isInitialized;

    if (!this.mapRenderer) {
      console.warn('[RenderingService] Cannot update map, renderer not initialized.');
      return;
    }
    this.mapRenderer.updateMap(newMapData);
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
      this.viewport = null;
      this.mapRenderer = null;
      this.isInitialized = null;
      console.log('[RenderingService] Destroyed.');
    }
  }
  
  private calculateZoomLimits(width: number, height: number): { minScale: number; maxScale: number } {
    const screenArea = width * height;
    const tileArea = HEX_WIDTH * HEX_HEIGHT;
    const minScale = Math.sqrt(screenArea / (MAX_TILES_ON_SCREEN * tileArea));
    const maxScale = Math.sqrt(screenArea / (MIN_TILES_ON_SCREEN * tileArea));
    return { minScale, maxScale };
  }
}

export const renderingService = new RenderingService(); 