import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport, IViewportOptions } from 'pixi-viewport';
import { MapData } from '../../shared/types/game.types';
import { HEX_HEIGHT, HEX_WIDTH, MAX_TILES_ON_SCREEN, MIN_TILES_ON_SCREEN } from '../../shared/constants/map.const';
import { MapRenderer } from '../rendering/MapRenderer';
import { GameViewportState, gameStateService } from './gameState.service';
import { settingsService } from './settings.service';
import { ClientGameStatePayload } from '../../shared/types/socket.types';

class RenderingService {
  private app: PIXI.Application | null = null;
  private viewport: PixiViewport | null = null;
  private mapRenderer: MapRenderer | null = null;
  private isInitialized: Promise<void> | null = null;
  private initializationResolver: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private gameId: string | null;
  private settingsUnsubscribe: (() => void) | null = null;
  
  // Event handlers need to be stored so they can be removed in destroy()
  private onDragEnd: (() => void) | null = null;
  private onPinchEnd: (() => void) | null = null;
  private onWheel: (() => void) | null = null;

  constructor() {
    this.gameId = null;
  }

  private saveState = (gameId: string) => {
    if (this.viewport) {
      const state: GameViewportState = {
        zoom: this.viewport.scale.x,
        center: { x: this.viewport.center.x, y: this.viewport.center.y }
      };
      gameStateService.saveViewportState(gameId, state);
      console.log(`[RenderingService] State saved for gameId: ${gameId}`);
    } else {
      console.warn('[RenderingService] Could not save state: viewport is missing.');
    }
  };

  private handleDragEnd = () => {
    this.saveState(this.gameId!);
  };

  private handlePinchEnd = () => {
    this.saveState(this.gameId!);
  };

  private handleWheel = () => {
    this.saveState(this.gameId!);
  };

  private handleSettingsChange = () => {
    // Re-render the map when settings change to apply visibility changes
    if (this.viewport && this.mapRenderer) {
      this.mapRenderer.render(this.viewport);
    }
  };

  public async initialize(containerElement: HTMLDivElement, gameState: ClientGameStatePayload, currentUserId: string): Promise<void> {
    if (this.app) {
      return this.isInitialized ?? Promise.resolve();
    }

    this.gameId = gameState.gameId;
    this.isInitialized = new Promise(resolve => {
      this.initializationResolver = resolve;
    });

    // Subscribe to settings changes to trigger re-renders
    this.settingsUnsubscribe = settingsService.subscribe(this.handleSettingsChange);

    // --- Create Pixi Application ---
    const app = new PIXI.Application();
    this.app = app;
    await app.init({
      background: '#1a1a1a',
      resizeTo: containerElement,
    });
    containerElement.appendChild(app.canvas);

    // --- Create Viewport ---
    const singleMapWidth = gameState.mapData.width * HEX_WIDTH * 0.75;
    const worldWidth = singleMapWidth * 3;
    const trueWorldHeight = (gameState.mapData.height * HEX_HEIGHT) + (HEX_HEIGHT / 2);
    
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
    const mapRenderer = new MapRenderer(app, gameState.mapData);
    this.mapRenderer = mapRenderer;
    await mapRenderer.loadAssets();
    viewport.addChild(mapRenderer.stage);
    mapRenderer.initializeMap();

    // --- Set Initial Camera State ---
    const savedState = this.gameId ? gameStateService.loadViewportState(this.gameId) : null;
    if (savedState) {
      viewport.setZoom(savedState.zoom, true);
      viewport.moveCenter(savedState.center.x, savedState.center.y);
    } else {
      // Find player's spawn tile and center on it
      const spawnPosition = this.findPlayerSpawnPosition(gameState, currentUserId);
      if (spawnPosition) {
        viewport.moveCenter(spawnPosition.x + singleMapWidth, spawnPosition.y);
        console.log(`[RenderingService] Centered map on player spawn at (${spawnPosition.x}, ${spawnPosition.y})`);
      } else {
        // Fallback to center of map
        viewport.moveCenter(singleMapWidth * 1.5, trueWorldHeight / 2);
        console.log('[RenderingService] No spawn found, centered on map center');
      }
      viewport.setZoom(initialZoomLimits.minScale, true);
    }
    mapRenderer.render(this.viewport);

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

    // --- State Saving ---
    this.onDragEnd = () => this.handleDragEnd();
    this.onPinchEnd = () => this.handlePinchEnd();

    let wheelTimeout: ReturnType<typeof setTimeout>;
    this.onWheel = () => {
      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
      }
      wheelTimeout = setTimeout(() => this.handleWheel(), 1000);
    };

    viewport.on('drag-end', this.onDragEnd);
    viewport.on('pinch-end', this.onPinchEnd);
    viewport.on('wheel', this.onWheel);

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          const { width, height } = entry.contentRect;
          if (this.viewport && this.mapRenderer) {
            this.viewport.resize(width, height);
            const newZoomLimits = this.calculateZoomLimits(width, height);
            this.viewport.clampZoom(newZoomLimits);
            this.mapRenderer.render(this.viewport);
            console.log(`[RenderingService] Viewport resized and re-rendered to ${width}x${height}.`);
          }
        }, 100); // 100ms debounce
      }
    });
    this.resizeObserver.observe(containerElement);

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
    if (this.viewport && this.onDragEnd && this.onPinchEnd && this.onWheel) {
      this.viewport.off('drag-end', this.onDragEnd);
      this.viewport.off('pinch-end', this.onPinchEnd);
      this.viewport.off('wheel', this.onWheel);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
      this.settingsUnsubscribe = null;
    }
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

  /**
   * Find the pixel position of a player's spawn tile
   */
  private findPlayerSpawnPosition(gameState: ClientGameStatePayload, currentUserId: string): { x: number; y: number } | null {
    const spawnTiles = gameState.mapData.tiles.filter(tile => tile.playerSpawn !== undefined);
    
    if (spawnTiles.length === 0) {
      console.warn('[RenderingService] No spawn tiles found in map data');
      return null;
    }

    // Find the current player's index in the players array
    const playerIndex = gameState.players.findIndex(player => player.userId === currentUserId);
    
    if (playerIndex === -1) {
      console.warn(`[RenderingService] Current user ${currentUserId} not found in players list`);
      return null;
    }

    // Sort spawns by their spawn number to ensure consistent ordering
    const sortedSpawns = spawnTiles.sort((a, b) => (a.playerSpawn || 0) - (b.playerSpawn || 0));
    
    // Assign spawn based on player index: 
    // Player 0 (creator) gets spawn 1, Player 1 (joiner) gets spawn 2, etc.
    const targetSpawnNumber = playerIndex + 1;
    const spawnTile = sortedSpawns.find(tile => tile.playerSpawn === targetSpawnNumber);
    
    if (!spawnTile) {
      console.warn(`[RenderingService] No spawn ${targetSpawnNumber} found for player index ${playerIndex}`);
      // Fallback to first available spawn
      const fallbackSpawn = sortedSpawns[0];
      if (fallbackSpawn) {
        const fallbackPosition = this.hexToPixel(fallbackSpawn.coordinates.q, fallbackSpawn.coordinates.r);
        console.log(`[RenderingService] Using fallback spawn ${fallbackSpawn.playerSpawn} for player ${currentUserId}`);
        return fallbackPosition;
      }
      return null;
    }

    // Convert hex coordinates to pixel coordinates
    const { q, r } = spawnTile.coordinates;
    const pixelPosition = this.hexToPixel(q, r);
    
    console.log(`[RenderingService] Player ${currentUserId} (index ${playerIndex}) assigned to P${targetSpawnNumber} spawn at hex (${q}, ${r}) -> pixel (${pixelPosition.x}, ${pixelPosition.y})`);
    return pixelPosition;
  }

  /**
   * Convert hex coordinates to pixel coordinates
   */
  private hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = HEX_WIDTH * 0.75 * q;
    let y = HEX_HEIGHT * r;
    
    // Offset for odd rows (q) to create the honeycomb pattern
    if (q % 2 !== 0) {
      y += HEX_HEIGHT / 2;
    }

    return { x, y };
  }
}

export const renderingService = new RenderingService(); 