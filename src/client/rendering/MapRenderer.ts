import * as PIXI from 'pixi.js';
import { Viewport as PixiViewport } from 'pixi-viewport';
import { MapData, TileData } from '../../shared/types/game.types';
import { ELEVATION_STEP, HEX_EAST_WALL_X_OFFSET, HEX_EAST_WALL_Y_OFFSET, HEX_FRONT_WALL_X_OFFSET, HEX_FRONT_WALL_Y_OFFSET, HEX_HEIGHT, HEX_OFFSET_X, HEX_OFFSET_Y, HEX_TEXT_OFFSET_X, HEX_TEXT_OFFSET_Y, HEX_WEST_WALL_X_OFFSET, HEX_WEST_WALL_Y_OFFSET, HEX_WIDTH, TILE_FONT, TILE_FONT_SIZE, TILE_PIXEL_MARGIN } from '../../shared/constants/map.const';
import { Tile } from './Tile';

function getTileKey(q: number, r: number) {
  return `${q},${r}`;
}

export class MapRenderer {
  private app: PIXI.Application;
  private mapData: MapData;
  private container: PIXI.Container;
  private textures: Record<string, PIXI.Texture> = {};
  private tileCache: Map<string, Tile[]> = new Map();
  private tileDataMap: Map<string, TileData> = new Map();
  private rowContainers: Map<number, PIXI.Container> = new Map();

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

  private _createTile(elevation: number, q: number, r: number): PIXI.Container {
    const tileContainer = new PIXI.Container();
    const elevationOffsetY = -(elevation * ELEVATION_STEP);

    // 1. Render Top Hex
    const topHex = new PIXI.Sprite(this.textures.hex);
    topHex.anchor.set(0);
    topHex.x = HEX_OFFSET_X;
    topHex.y = HEX_OFFSET_Y + elevationOffsetY;
    tileContainer.addChild(topHex);
    
    // 2. Render the Elevation Text
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

    // 3. Render the Coordinates Text
    const coordStyle = new PIXI.TextStyle({
      fontFamily: TILE_FONT,
      fontSize: TILE_FONT_SIZE / 2,
      fill: '#333333',
      align: 'center',
    });
    const coordText = new PIXI.Text({
      text: `(${q},${r})`,
      style: coordStyle,
    });
    coordText.anchor.set(0.5);
    coordText.x = HEX_TEXT_OFFSET_X;
    coordText.y = elevationText.y + TILE_FONT_SIZE;
    tileContainer.addChild(coordText);

    // 4. Render the West Wall
    const westWall = new PIXI.Sprite(this.textures.hexWallSide);
    westWall.anchor.set(0);
    westWall.x = HEX_WEST_WALL_X_OFFSET;
    westWall.y = HEX_WEST_WALL_Y_OFFSET + elevationOffsetY;
    tileContainer.addChild(westWall);
    
    // 5. Render the East Wall (reflected west wall texture)
    const eastWall = new PIXI.Sprite(this.textures.hexWallSide);
    eastWall.anchor.set(0);
    eastWall.scale.x = -1;
    eastWall.x = HEX_EAST_WALL_X_OFFSET;
    eastWall.y = HEX_EAST_WALL_Y_OFFSET + elevationOffsetY;
    tileContainer.addChild(eastWall);

    // South Wall
    const southWall = new PIXI.Sprite(this.textures.hexWallFront);
    southWall.anchor.set(0);
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

    // Ensure all row containers are created and added in order first
    for (let r = 0; r < this.mapData.height; r++) {
      const rowContainer = new PIXI.Container();
      this.container.addChild(rowContainer);
      this.rowContainers.set(r, rowContainer);
    }

    for (const tileData of sortedTiles) {
      const { q, r } = tileData.coordinates;
      const key = getTileKey(q, r);
      const { x, y } = this._axialToPixel(q, r);

      const mapPixelWidth = this.mapData.width * HEX_WIDTH * 0.75;

      const tileInstances = [
        new Tile(tileData, this.textures), // Left copy
        new Tile(tileData, this.textures), // Center copy
        new Tile(tileData, this.textures), // Right copy
      ];

      tileInstances[0].container.x = x;
      tileInstances[0].container.y = y;
      tileInstances[1].container.x = x + mapPixelWidth;
      tileInstances[1].container.y = y;
      tileInstances[2].container.x = x + (mapPixelWidth * 2);
      tileInstances[2].container.y = y;

      const rowContainer = this.rowContainers.get(r);
      if (rowContainer) {
        for (const instance of tileInstances) {
          instance.container.visible = false;
          rowContainer.addChild(instance.container);
        }
      }
      
      this.tileCache.set(key, tileInstances);
      this.tileDataMap.set(key, tileData);
    }
    
    console.log(`[MapRenderer] Initialized and cached ${this.tileCache.size} tile sets, creating a 3-map world.`);
  }

  public updateMap(newMapData: MapData) {
    console.log('[MapRenderer] Received map update. Checking for changes...');
    let updatedCount = 0;
    for (const newTileData of newMapData.tiles) {
      const key = getTileKey(newTileData.coordinates.q, newTileData.coordinates.r);
      const oldTileData = this.tileDataMap.get(key);

      if (oldTileData && oldTileData.elevation !== newTileData.elevation) {
        console.log(`Tile ${key} changed elevation from ${oldTileData.elevation} to ${newTileData.elevation}`);
        updatedCount++;
        
        const tileInstances = this.tileCache.get(key);
        if (tileInstances) {
          // Create new Tile objects with the updated data
          // We must create new instances for each copy to maintain correct positioning and state.
          const newLeft = new Tile(newTileData, this.textures);
          const newCenter = new Tile(newTileData, this.textures);
          const newRight = new Tile(newTileData, this.textures);
          
          const newInstances = [newLeft, newCenter, newRight];

          for (let i = 0; i < tileInstances.length; i++) {
            const oldContainer = tileInstances[i].container;
            const newContainer = newInstances[i].container;
            
            // Position the new container at the old container's position
            newContainer.x = oldContainer.x;
            newContainer.y = oldContainer.y;
            newContainer.visible = oldContainer.visible;
            
            // Replace in the row container and destroy the old one
            const rowContainer = oldContainer.parent;
            if (rowContainer) {
              rowContainer.removeChild(oldContainer);
              rowContainer.addChild(newContainer);
            }
            oldContainer.destroy();
          }
          // Update the cache with the new instances
          this.tileCache.set(key, newInstances);
        }
        
        // Update the internal state
        this.tileDataMap.set(key, newTileData);
      }
    }
    if (updatedCount > 0) {
      console.log(`[MapRenderer] Updated ${updatedCount} tiles.`);
    }
  }

  public render(viewport: PixiViewport): void {
    const visibleBounds = viewport.getVisibleBounds();
    visibleBounds.pad(160);

    for (const [key, tileInstances] of this.tileCache.entries()) {
      for (const tile of tileInstances) {
        const TILE_WIDTH = HEX_WIDTH + 10;
        const TILE_HEIGHT = HEX_HEIGHT + 10;
        const tileRect = new PIXI.Rectangle(tile.container.x, tile.container.y, TILE_WIDTH, TILE_HEIGHT);
        
        if (visibleBounds.intersects(tileRect)) {
          tile.container.visible = true;
        } else {
          tile.container.visible = false;
        }
      }
    }
  }
} 