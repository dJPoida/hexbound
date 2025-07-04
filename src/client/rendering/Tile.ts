import * as PIXI from 'pixi.js';
import { TileData, TerrainType } from '../../shared/types/game.types';
import { ELEVATION_STEP, HEX_OFFSET_X, HEX_OFFSET_Y, HEX_TEXT_OFFSET_X, HEX_TEXT_OFFSET_Y, HEX_WIDTH, TILE_FONT, TILE_FONT_SIZE } from '../../shared/constants/map.const';

function getTextureForTerrain(terrain: TerrainType, textures: Record<string, PIXI.Texture>): PIXI.Texture {
  switch (terrain) {
    case TerrainType.GRASSLAND:
      return textures.tile_grassland;
    case TerrainType.OCEAN:
      return textures.tile_ocean;
    case TerrainType.ICECAP:
      return textures.tile_icecap;
    // Add other cases as new terrain types are implemented
    default:
      return textures.tile_grassland; // Default to grassland if texture is missing
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

    const bodyTexture = getTextureForTerrain(tileData.terrain, textures);
    this.body = new PIXI.Sprite(bodyTexture);
    this.body.anchor.set(0);
    this.body.x = HEX_OFFSET_X;
    this.body.y = HEX_OFFSET_Y + elevationOffsetY;

    this.outline = new PIXI.Sprite(textures.hex_outline);
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
      style: debugTextStyle 
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
        style: spawnTextStyle 
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
} 