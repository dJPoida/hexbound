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

  public render(): void {
    const TILE_WIDTH = 600;
    const TILE_HEIGHT = 600;
    const HEX_WIDTH = 600;
    const HEX_HEIGHT = 400;
    const ELEVATION_STEP = 50;
    const testElevation = 2;

    console.log('[MapRenderer] Rendering map with data:', this.mapData);

    if (!this.textures.hex) {
      console.error('[MapRenderer] Hex texture not loaded. Cannot render map.');
      return;
    }

    // Clear the container for a fresh render
    this.container.removeChildren();
    
    // Scale down all sprites for visibility during testing
    const groupScale = 0.25;
    this.container.scale.set(groupScale);

    // Center the tile in the viewport
    const centerX = (this.app.screen.width / groupScale) / 2;
    const centerY = (this.app.screen.height / groupScale) / 2;

    const tileContainer = new PIXI.Container();
    tileContainer.x = centerX;
    tileContainer.y = centerY;
    this.container.addChild(tileContainer);

    const elevatedY = -(testElevation * ELEVATION_STEP);

    // 1. Render Top Hex
    const topHex = new PIXI.Sprite(this.textures.hex);
    topHex.anchor.set(0);
    topHex.y = elevatedY;
    tileContainer.addChild(topHex);

    if (testElevation > 0) {
      // West Wall (reflected east wall texture)
      const westWall = new PIXI.Sprite(this.textures.hexWallSide);
      westWall.anchor.set(1, 0);
      westWall.scale.x = -1; // Mirror the texture
      westWall.x = 0;
      westWall.y = (TILE_HEIGHT - (HEX_HEIGHT / 2)) + elevatedY;
      tileContainer.addChild(westWall);

      // East Wall
      const eastWall = new PIXI.Sprite(this.textures.hexWallSide);
      eastWall.anchor.set(0, 0);
      eastWall.x = 450;
      eastWall.y = (TILE_HEIGHT - (HEX_HEIGHT / 2)) + elevatedY;
      tileContainer.addChild(eastWall);

      // South Wall
      const southWall = new PIXI.Sprite(this.textures.hexWallFront);
      southWall.anchor.set(0, 0); // Anchor to top-center
      southWall.x = HEX_WIDTH / 4;
      southWall.y = TILE_HEIGHT + elevatedY;
      tileContainer.addChild(southWall);
    }
    
    console.log('[MapRenderer] Rendered a single test tile with walls.');
  }
} 