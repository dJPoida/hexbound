import * as PIXI from 'pixi.js';
import { TileData } from '../../shared/types/game.types';
import { ELEVATION_STEP, HEX_EAST_WALL_X_OFFSET, HEX_EAST_WALL_Y_OFFSET, HEX_FRONT_WALL_X_OFFSET, HEX_FRONT_WALL_Y_OFFSET, HEX_HEIGHT, HEX_OFFSET_X, HEX_OFFSET_Y, HEX_TEXT_OFFSET_X, HEX_TEXT_OFFSET_Y, HEX_WEST_WALL_X_OFFSET, HEX_WEST_WALL_Y_OFFSET, HEX_WIDTH, TILE_FONT, TILE_FONT_SIZE } from '../../shared/constants/map.const';

export class Tile {
  public container: PIXI.Container;
  private topHex: PIXI.Sprite;
  private westWall: PIXI.Sprite;
  private eastWall: PIXI.Sprite;
  private southWall: PIXI.Sprite;
  private outline: PIXI.Sprite;
  private elevationText: PIXI.Text;
  private coordText: PIXI.Text;

  constructor(tileData: TileData, textures: Record<string, PIXI.Texture>) {
    const { coordinates, elevation } = tileData;
    const { q, r } = coordinates;

    this.container = new PIXI.Container();
    const elevationOffsetY = -(elevation * ELEVATION_STEP);

    // Create all sprites
    this.topHex = new PIXI.Sprite(textures.hex);
    this.westWall = new PIXI.Sprite(textures.hexWallSide);
    this.eastWall = new PIXI.Sprite(textures.hexWallSide);
    this.southWall = new PIXI.Sprite(textures.hexWallFront);
    this.outline = new PIXI.Sprite(textures.hexOutline);

    // Configure sprites
    this.topHex.anchor.set(0);
    this.topHex.x = HEX_OFFSET_X;
    this.topHex.y = HEX_OFFSET_Y + elevationOffsetY;

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
    
    this.westWall.anchor.set(0);
    this.westWall.x = HEX_WEST_WALL_X_OFFSET;
    this.westWall.y = HEX_WEST_WALL_Y_OFFSET + elevationOffsetY;

    this.eastWall.anchor.set(0);
    this.eastWall.scale.x = -1;
    this.eastWall.x = HEX_EAST_WALL_X_OFFSET;
    this.eastWall.y = HEX_EAST_WALL_Y_OFFSET + elevationOffsetY;

    this.southWall.anchor.set(0);
    this.southWall.x = HEX_FRONT_WALL_X_OFFSET;
    this.southWall.y = HEX_FRONT_WALL_Y_OFFSET + elevationOffsetY;

    // Add sprites to container in the correct render order
    this.container.addChild(
      this.westWall,
      this.southWall,
      this.eastWall,
      this.topHex,
      this.outline,
      this.elevationText,
      this.coordText
    );
  }
} 