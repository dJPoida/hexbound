import * as PIXI from 'pixi.js';

import {
  ELEVATION_STEP,
  HEX_OFFSET_X,
  HEX_OFFSET_Y,
  HEX_TEXT_OFFSET_X,
  HEX_TEXT_OFFSET_Y,
  TILE_FONT,
  TILE_FONT_SIZE,
} from '../../shared/constants/map.const';
import { TerrainType, TileData } from '../../shared/types/map';

function getTextureForTerrain(
  terrain: TerrainType,
  elevation: number,
  textures: Record<string, PIXI.Texture>
): PIXI.Texture {
  switch (terrain) {
    case TerrainType.GRASSLAND: {
      // Clamp elevation to valid range (0-4) and select appropriate texture
      const clampedElevation = Math.max(0, Math.min(4, elevation));
      const grasslandTextureKey = `tile_grassland_e${clampedElevation}`;
      return textures[grasslandTextureKey] || textures.tile_grassland_e0; // Fallback to e0 if texture missing
    }
    case TerrainType.OCEAN:
      return textures.tile_ocean;
    case TerrainType.ICECAP:
      return textures.tile_icecap;
    // Add other cases as new terrain types are implemented
    default:
      return textures.tile_grassland_e0; // Default to grassland e0 if texture is missing
  }
}

export class Tile {
  public container: PIXI.Container;
  private body: PIXI.Sprite;
  public outline: PIXI.Sprite;
  public debugText: PIXI.Text;
  public spawnText: PIXI.Text | null = null;

  constructor(tileData: TileData, textures: Record<string, PIXI.Texture>) {
    const { coordinates, elevation, playerSpawn } = tileData;
    const { q, r } = coordinates;

    this.container = new PIXI.Container();
    const elevationOffsetY = -(elevation * ELEVATION_STEP);

    const bodyTexture = getTextureForTerrain(tileData.terrain, elevation, textures);
    this.body = new PIXI.Sprite(bodyTexture);
    this.body.anchor.set(0);
    this.body.x = HEX_OFFSET_X;
    this.body.y = HEX_OFFSET_Y + elevationOffsetY;

    this.outline = new PIXI.Sprite(textures.hex_grid);
    this.outline.anchor.set(0);
    this.outline.x = HEX_OFFSET_X;
    this.outline.y = HEX_OFFSET_Y + elevationOffsetY;

    const debugTextStyle: Partial<PIXI.TextStyle> = {
      fontFamily: TILE_FONT,
      fontSize: TILE_FONT_SIZE / 2,
      fill: '#333333',
      align: 'center',
    };

    this.debugText = new PIXI.Text({
      text: `(${q},${r}) [${elevation}]`,
      style: debugTextStyle,
    });
    this.debugText.anchor.set(0.5);
    this.debugText.x = HEX_TEXT_OFFSET_X;
    this.debugText.y = HEX_TEXT_OFFSET_Y + 25 + elevationOffsetY; // Move text toward bottom of cell but not too low

    // Create spawn text if this tile is a player spawn
    if (playerSpawn !== undefined) {
      const spawnTextStyle: Partial<PIXI.TextStyle> = {
        fontFamily: TILE_FONT,
        fontSize: TILE_FONT_SIZE / 2,
        fill: '#ff6600', // Orange color to make it stand out
        align: 'center',
      };

      this.spawnText = new PIXI.Text({
        text: `P${playerSpawn} Spawn`,
        style: spawnTextStyle,
      });
      this.spawnText.anchor.set(0.5);
      this.spawnText.x = HEX_TEXT_OFFSET_X;
      this.spawnText.y = HEX_TEXT_OFFSET_Y + 10 + elevationOffsetY; // Above the coordinate text
    }

    // Add sprites to container in the correct render order
    this.container.addChild(this.body, this.outline, this.debugText);

    // Add spawn text if it exists
    if (this.spawnText) {
      this.container.addChild(this.spawnText);
    }
  }

  /**
   * Properly clean up all PIXI resources
   */
  public destroy(): void {
    // Destroy all child sprites and text objects
    if (this.body) {
      this.body.destroy({ children: true });
    }
    if (this.outline) {
      this.outline.destroy({ children: true });
    }
    if (this.debugText) {
      this.debugText.destroy({ children: true });
    }
    if (this.spawnText) {
      this.spawnText.destroy({ children: true });
    }

    // Destroy the container itself
    if (this.container) {
      this.container.destroy({ children: true });
    }
  }
}
