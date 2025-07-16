// Complete map data structure

import { TileData } from './tile.type';

export interface MapData {
  width: number;
  height: number;
  tiles: TileData[];
}
