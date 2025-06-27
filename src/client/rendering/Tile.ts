import * as PIXI from 'pixi.js';
import { TileData } from '../../shared/types/game.types';
import { ELEVATION_STEP, HEX_OFFSET_X, HEX_OFFSET_Y, HEX_TEXT_OFFSET_X, HEX_TEXT_OFFSET_Y, HEX_WIDTH, TILE_FONT, TILE_FONT_SIZE } from '../../shared/constants/map.const';

export class Tile {
  public container: PIXI.Container;
  private body: PIXI.Sprite;
  private outline: PIXI.Sprite;
  private elevationText: PIXI.Text;
  private coordText: PIXI.Text;

  constructor(tileData: TileData, textures: Record<string, PIXI.Texture>) {
    const { coordinates, elevation } = tileData;
    const { q, r } = coordinates;

    this.container = new PIXI.Container();
    const elevationOffsetY = -(elevation * ELEVATION_STEP);

    // For now, all tiles are plains. This will be dynamic later.
    this.body = new PIXI.Sprite(textures.tile_plains);
    this.body.anchor.set(0);
    this.body.x = HEX_OFFSET_X;
    this.body.y = HEX_OFFSET_Y + elevationOffsetY;

    this.outline = new PIXI.Sprite(textures.hex_outline);
    this.outline.anchor.set(0);
    this.outline.x = HEX_OFFSET_X;
    this.outline.y = HEX_OFFSET_Y + elevationOffsetY;
    
    const textStyle: Partial<PIXI.TextStyle> = {
      fontFamily: TILE_FONT,
      fontSize: TILE_FONT_SIZE,
      fill: '#000000',
      align: 'center',
    };

    this.elevationText = new PIXI.Text({ text: elevation.toString(), style: textStyle });
    this.elevationText.anchor.set(0.5);
    this.elevationText.x = HEX_TEXT_OFFSET_X;
    this.elevationText.y = HEX_TEXT_OFFSET_Y + elevationOffsetY;
    
    this.coordText = new PIXI.Text({ text: `(${q},${r})`, style: { ...textStyle, fontSize: TILE_FONT_SIZE / 2, fill: '#333333' } });
    this.coordText.anchor.set(0.5);
    this.coordText.x = HEX_TEXT_OFFSET_X;
    this.coordText.y = this.elevationText.y + TILE_FONT_SIZE;
    
    // Add sprites to container in the correct render order
    this.container.addChild(
      this.body,
      this.outline,
      this.elevationText,
      this.coordText
    );
  }
} 