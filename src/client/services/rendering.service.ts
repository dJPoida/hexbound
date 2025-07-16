import * as PIXI from 'pixi.js';
import { IViewportOptions, Viewport as PixiViewport } from 'pixi-viewport';

import { HEX_HEIGHT, HEX_WIDTH, MAX_TILES_ON_SCREEN, MIN_TILES_ON_SCREEN } from '../../shared/constants/map.const';
import { MapData } from '../../shared/types/map';
import { ClientGameStatePayload } from '../../shared/types/socket';
import { MapRenderer } from '../rendering/MapRenderer';
import { GameViewportState } from '../types/services';
import { gameStateService } from './gameState.service';
import { settingsService } from './settings.service';

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

  public async initialize(containerElement: HTMLDivElement, gameState: ClientGameStatePayload, mapData: MapData, currentUserId: string): Promise<void> {
    console.log(`[RenderingService] Initialize called for game ${gameState.gameId}`);
    
    // Prevent double initialization
    if (this.app) {
      console.log('[RenderingService] App already exists, returning existing initialization promise');
      return this.isInitialized ?? Promise.resolve();
    }

    // Ensure we're starting with a clean state
    if (this.isInitialized) {
      console.warn('[RenderingService] isInitialized exists but app is null, cleaning up and reinitializing');
      this.isInitialized = null;
      this.initializationResolver = null;
    }

    this.gameId = gameState.gameId;
    this.isInitialized = new Promise(resolve => {
      this.initializationResolver = resolve;
    });

    try {
      // Subscribe to settings changes to trigger re-renders
      this.settingsUnsubscribe = settingsService.subscribe(this.handleSettingsChange);

      // --- Create Pixi Application ---
      console.log('[RenderingService] Creating PixiJS application');
      const app = new PIXI.Application();
      this.app = app;
      await app.init({
        background: '#1a1a1a',
        resizeTo: containerElement,
      });
      containerElement.appendChild(app.canvas);
      console.log('[RenderingService] PixiJS application created and initialized');

      // --- Create Viewport ---
      const singleMapWidth = mapData.width * HEX_WIDTH * 0.75;
      const worldWidth = singleMapWidth * 3;
      const trueWorldHeight = (mapData.height * HEX_HEIGHT) + (HEX_HEIGHT / 2);
      
      // Set world height to actual map height minus 3 tiles for padding (2 top, 1 bottom)
      const worldHeight = trueWorldHeight - (3 * HEX_HEIGHT);

      console.log(`[RenderingService] Creating viewport with world dimensions: ${worldWidth}x${worldHeight}`);
      const viewport = new PixiViewport({
        screenWidth: containerElement.clientWidth,
        screenHeight: containerElement.clientHeight,
        worldWidth,
        worldHeight,
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
      console.log('[RenderingService] Initializing map renderer');
      const mapRenderer = new MapRenderer(app, mapData);
      this.mapRenderer = mapRenderer;
      await mapRenderer.loadAssets();
      viewport.addChild(mapRenderer.stage);
      mapRenderer.initializeMap();
      console.log('[RenderingService] Map renderer initialized');

      // --- Set Initial Camera State ---
      const savedState = this.gameId ? gameStateService.loadViewportState(this.gameId) : null;
      if (savedState) {
        viewport.setZoom(savedState.zoom, true);
        viewport.moveCenter(savedState.center.x, savedState.center.y);
        console.log('[RenderingService] Restored saved viewport state');
      } else {
        // Find player's spawn tile and center on it
        const spawnPosition = this.findPlayerSpawnPosition(gameState, mapData, currentUserId);
        if (spawnPosition) {
          viewport.moveCenter(spawnPosition.x + singleMapWidth, spawnPosition.y);
          console.log(`[RenderingService] Centered map on player spawn at (${spawnPosition.x}, ${spawnPosition.y})`);
        } else {
          // Fallback to center of map
          viewport.moveCenter(singleMapWidth * 1.5, worldHeight / 2);
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

      console.log('[RenderingService] Initialization complete');
      if (this.initializationResolver) {
        this.initializationResolver();
      }
    } catch (error) {
      console.error('[RenderingService] Error during initialization:', error);
      // Clean up on error
      this.destroy();
      throw error;
    }
  }

  public async updateMap(newMapData: MapData): Promise<void> {
    console.log(`[RenderingService] updateMap called with ${newMapData.width}x${newMapData.height} map, ${newMapData.tiles.length} tiles`);
    
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
    
    console.log('[RenderingService] Calling mapRenderer.updateMap()');
    this.mapRenderer.updateMap(newMapData);
  }

  public destroy(): void {
    console.log('[RenderingService] Destroy called');
    
    // Clean up event handlers first
    if (this.viewport && this.onDragEnd && this.onPinchEnd && this.onWheel) {
      try {
        this.viewport.off('drag-end', this.onDragEnd);
        this.viewport.off('pinch-end', this.onPinchEnd);
        this.viewport.off('wheel', this.onWheel);
      } catch (error) {
        console.warn('[RenderingService] Error cleaning up viewport event handlers:', error);
      }
    }
    
    // Clean up resize observer
    if (this.resizeObserver) {
      try {
        this.resizeObserver.disconnect();
      } catch (error) {
        console.warn('[RenderingService] Error disconnecting resize observer:', error);
      }
      this.resizeObserver = null;
    }
    
    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // Clean up settings subscription
    if (this.settingsUnsubscribe) {
      try {
        this.settingsUnsubscribe();
      } catch (error) {
        console.warn('[RenderingService] Error unsubscribing from settings:', error);
      }
      this.settingsUnsubscribe = null;
    }
    
    // Clean up PixiJS application last
    if (this.app) {
      try {
        // Unload all assets first to prevent texture warnings
        const textureKeys = ['tile_grassland', 'tile_ocean', 'tile_icecap', 'hex_outline', 'hex_selected'];
        for (const key of textureKeys) {
          try {
            PIXI.Assets.unload(key);
          } catch (error) {
            // Ignore errors if texture wasn't loaded
            console.debug(`[RenderingService] Could not unload texture ${key}:`, error);
          }
        }
        
        // Use the correct destroy parameters for PixiJS v8 (without texture: true)
        this.app.destroy(true, { 
          children: true
        });
        console.log('[RenderingService] PixiJS application destroyed successfully');
      } catch (error) {
        console.warn('[RenderingService] Error destroying PixiJS application:', error);
      } finally {
        // Always null out the references even if destroy fails
        this.app = null;
        this.viewport = null;
        this.mapRenderer = null;
        this.isInitialized = null;
        this.initializationResolver = null;
        this.gameId = null;
        this.onDragEnd = null;
        this.onPinchEnd = null;
        this.onWheel = null;
      }
    } else {
      // Even if app is null, clean up other references
      this.viewport = null;
      this.mapRenderer = null;
      this.isInitialized = null;
      this.initializationResolver = null;
      this.gameId = null;
      this.onDragEnd = null;
      this.onPinchEnd = null;
      this.onWheel = null;
    }
    
    console.log('[RenderingService] Destroy complete');
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
  private findPlayerSpawnPosition(gameState: ClientGameStatePayload, mapData: MapData, currentUserId: string): { x: number; y: number } | null {
    const spawnTiles = mapData.tiles.filter(tile => tile.playerSpawn !== undefined);
    
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

    // Subtract 1.5-tile offset to pull all tiles up toward the top of the world
    y -= 1.5 * HEX_HEIGHT;

    return { x, y };
  }
}

export const renderingService = new RenderingService();

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { renderingService: RenderingService }).renderingService = renderingService;
} 