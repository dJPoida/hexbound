import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport } from 'pixi-viewport';
import { MapData, TileData } from '../../shared/types/game.types';
import { ELEVATION_STEP, HEX_EAST_WALL_X_OFFSET, HEX_EAST_WALL_Y_OFFSET, HEX_FRONT_WALL_X_OFFSET, HEX_FRONT_WALL_Y_OFFSET, HEX_HEIGHT, HEX_OFFSET_X, HEX_OFFSET_Y, HEX_TEXT_OFFSET_X, HEX_TEXT_OFFSET_Y, HEX_WEST_WALL_X_OFFSET, HEX_WEST_WALL_Y_OFFSET, HEX_WIDTH, TILE_FONT, TILE_FONT_SIZE, TILE_PIXEL_MARGIN } from '../../shared/constants/map.const';

export class MapRenderer {
  private app: PIXI.Application;
  private mapData: MapData;
  private container: PIXI.Container;
  private textures: Record<string, PIXI.Texture> = {};
  private tileCache: Map<TileData, PIXI.Container[]> = new Map();

  constructor(app: PIXI.Application, mapData: MapData) {
    this.app = app;
    this.mapData = mapData;
    this.container = new PIXI.Container();
    console.log('[MapRenderer] Initialized.');
  }

  public get stage(): PIXI.Container {
    return this.container;
  }

  public async loadAssets(): Promise<void> {
    const assetsToLoad = [
      { alias: 'hex', src: '/images/tiles/hex.png' },
      { alias: 'hexWallFront', src: '/images/tiles/hex_wall_front.png' },
      { alias: 'hexWallSide', src: '/images/tiles/hex_wall_side.png' },
    ];
    try {
      this.textures = await PIXI.Assets.load(assetsToLoad);
      console.log('[MapRenderer] Tile assets loaded successfully.');
    } catch (error) {
      console.error('[MapRenderer] Error loading assets:', error);
    }
  }

  private _axialToPixel(q: number, r: number): { x: number; y: number } {
    const x = HEX_WIDTH * 0.75 * q;
    let y = HEX_HEIGHT * r;
    
    // Offset for odd rows (q) to create the honeycomb pattern
    if (q % 2 !== 0) {
      y += HEX_HEIGHT / 2;
    }

    return { x, y };
  }

  private _createTile(elevation: number): PIXI.Container {
    const tileContainer = new PIXI.Container();
    const elevationOffsetY = -(elevation * ELEVATION_STEP);

    // 1. Render Top Hex
    const topHex = new PIXI.Sprite(this.textures.hex);
    topHex.anchor.set(0);
    topHex.x = HEX_OFFSET_X;
    topHex.y = HEX_OFFSET_Y + elevationOffsetY;
    tileContainer.addChild(topHex);
    
    const textStyle = new PIXI.TextStyle({
      fontFamily: TILE_FONT,
      fontSize: TILE_FONT_SIZE,
      fill: '#000000',
      align: 'center',
    });

    const elevationText = new PIXI.Text({
      text: elevation.toString(),
      style: textStyle,
    });
    elevationText.anchor.set(0.5);
    elevationText.x = HEX_TEXT_OFFSET_X;
    elevationText.y = HEX_TEXT_OFFSET_Y + elevationOffsetY;
    tileContainer.addChild(elevationText);

    // West Wall (reflected east wall texture)
    const westWall = new PIXI.Sprite(this.textures.hexWallSide);
    westWall.anchor.set(0, 0);
    westWall.x = HEX_WEST_WALL_X_OFFSET;
    westWall.y = HEX_WEST_WALL_Y_OFFSET + elevationOffsetY;
    tileContainer.addChild(westWall);
    
    // East Wall
    const eastWall = new PIXI.Sprite(this.textures.hexWallSide);
    eastWall.scale.x = -1;
    eastWall.anchor.set(0, 0);
    eastWall.x = HEX_EAST_WALL_X_OFFSET;
    eastWall.y = HEX_EAST_WALL_Y_OFFSET + elevationOffsetY;
    tileContainer.addChild(eastWall);

    // South Wall
    const southWall = new PIXI.Sprite(this.textures.hexWallFront);
    southWall.anchor.set(0, 0);
    southWall.x = HEX_FRONT_WALL_X_OFFSET;
    southWall.y = HEX_FRONT_WALL_Y_OFFSET + elevationOffsetY;
    tileContainer.addChild(southWall);
    
    return tileContainer;
  }
  
  public initializeMap(): void {
    if (!this.textures.hex) {
      console.error('[MapRenderer] Cannot initialize map, textures not loaded.');
      return;
    }

    const sortedTiles = [...this.mapData.tiles].sort((a, b) => {
      const aPos = this._axialToPixel(a.coordinates.q, a.coordinates.r);
      const bPos = this._axialToPixel(b.coordinates.q, b.coordinates.r);

      if (aPos.y !== bPos.y) {
        return aPos.y - bPos.y;
      }
      return aPos.x - bPos.x;
    });

    for (const tileData of sortedTiles) {
      const { q, r } = tileData.coordinates;
      const { x, y } = this._axialToPixel(q, r);

      const mapPixelWidth = this.mapData.width * HEX_WIDTH * 0.75;

      // This is to enable the treadmill effect for wrapping in the x axis
      const tileInstances = [
        this._createTile(tileData.elevation), // Left copy
        this._createTile(tileData.elevation), // Center copy
        this._createTile(tileData.elevation), // Right copy
      ];

      tileInstances[0].x = x;
      tileInstances[1].x = x + mapPixelWidth;
      tileInstances[2].x = x + (mapPixelWidth * 2);

      for (let i = 0; i < tileInstances.length; i++) {
        const instance = tileInstances[i];
        instance.y = y;
        instance.visible = false;
        this.container.addChild(instance);
      }
      
      this.tileCache.set(tileData, tileInstances);
    }
    
    console.log(`[MapRenderer] Initialized and cached ${this.tileCache.size} tile sets, creating a 3-map world.`);
  }

  public render(viewport: PixiViewport): void {
    const visibleBounds = viewport.getVisibleBounds();
    visibleBounds.pad(160); // Add padding to prevent tiles popping in at the edges

    let renderedCount = 0;
    for (const [tileData, tileContainers] of this.tileCache.entries()) {
      for (const tileContainer of tileContainers) {
        const TILE_WIDTH = HEX_WIDTH + (TILE_PIXEL_MARGIN * 2);
        const TILE_HEIGHT = HEX_HEIGHT + (TILE_PIXEL_MARGIN * 2);
        const tileRect = new PIXI.Rectangle(tileContainer.x, tileContainer.y, TILE_WIDTH, TILE_HEIGHT);
        
        if (visibleBounds.intersects(tileRect)) {
          tileContainer.visible = true;
          renderedCount++;
        } else {
          tileContainer.visible = false;
        }
      }
    }
    
    // Optional: Throttle this log as it can be noisy
    // console.log(`[MapRenderer] Rendered ${renderedCount} tiles.`);
  }
} 