import * as PIXI from 'pixi.js';
import { MapData } from '../../shared/types/game.types';

export class MapRenderer {
  private app: PIXI.Application;
  private mapData: MapData;
  private container: PIXI.Container;
  private textures: Record<string, PIXI.Texture> = {};

  constructor(app: PIXI.Application, mapData: MapData) {
    this.app = app;
    this.mapData = mapData;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    console.log('[MapRenderer] Initialized.');
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
    const HEX_WIDTH = 600;
    const HEX_HEIGHT = 400;

    const x = HEX_WIDTH * 0.75 * q;
    let y = HEX_HEIGHT * r;
    
    // Offset for odd rows (q) to create the honeycomb pattern
    if (q % 2 !== 0) {
      y += HEX_HEIGHT / 2;
    }

    return { x, y };
  }

  private _createTile(elevation: number): PIXI.Container {
    const TILE_HEIGHT = 600;
    const HEX_WIDTH = 600;
    const HEX_HEIGHT = 400;
    const ELEVATION_STEP = 50;
    
    const tileContainer = new PIXI.Container();
    const elevatedY = -(elevation * ELEVATION_STEP);

    const topHex = new PIXI.Sprite(this.textures.hex);
    topHex.anchor.set(0);
    topHex.y = elevatedY;
    tileContainer.addChild(topHex);

    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 100,
      fill: '#000000',
      align: 'center',
    });

    const elevationText = new PIXI.Text({
      text: elevation.toString(),
      style: textStyle,
    });
    elevationText.anchor.set(0.5);
    elevationText.x = HEX_WIDTH / 2;
    elevationText.y = elevatedY + (TILE_HEIGHT - HEX_HEIGHT / 2);
    tileContainer.addChild(elevationText);

    // West Wall (reflected east wall texture)
    const westWall = new PIXI.Sprite(this.textures.hexWallSide);
    westWall.anchor.set(1, 0);
    westWall.scale.x = -1; // Mirror the texture
    westWall.x = 0;
    westWall.y = TILE_HEIGHT - HEX_HEIGHT / 2 + elevatedY;
    tileContainer.addChild(westWall);

    // East Wall
    const eastWall = new PIXI.Sprite(this.textures.hexWallSide);
    eastWall.anchor.set(0, 0);
    eastWall.x = 450;
    eastWall.y = TILE_HEIGHT - HEX_HEIGHT / 2 + elevatedY;
    tileContainer.addChild(eastWall);

    // South Wall
    const southWall = new PIXI.Sprite(this.textures.hexWallFront);
    southWall.anchor.set(0, 0); // Anchor to top-center
    southWall.x = HEX_WIDTH / 4;
    southWall.y = TILE_HEIGHT + elevatedY;
    tileContainer.addChild(southWall);
    
    return tileContainer;
  }

  public render(): void {
    console.log('[MapRenderer] Rendering map with data:', this.mapData);

    if (!this.textures.hex) {
      console.error('[MapRenderer] Hex texture not loaded. Cannot render map.');
      return;
    }

    // Clear the container for a fresh render
    this.container.removeChildren();
    
    const groupScale = 0.1; // Make tiles smaller to see more of the map
    this.container.scale.set(groupScale);

    const sortedTiles = [...this.mapData.tiles].sort((a, b) => {
      const aPos = this._axialToPixel(a.coordinates.q, a.coordinates.r);
      const bPos = this._axialToPixel(b.coordinates.q, b.coordinates.r);

      if (aPos.y !== bPos.y) {
        return aPos.y - bPos.y;
      }
      return aPos.x - bPos.x;
    });

    const filteredTiles = sortedTiles.filter(tile => tile.coordinates.r === 0);

    for (const tileData of filteredTiles) {
      const { q, r } = tileData.coordinates;
      const { x, y } = this._axialToPixel(q, r);

      const tileContainer = this._createTile(tileData.elevation);
      tileContainer.x = x;
      tileContainer.y = y;
      this.container.addChild(tileContainer);
    }
    
    console.log(`[MapRenderer] Rendered ${filteredTiles.length} tiles.`);
  }
} 