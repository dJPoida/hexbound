// Individual tile data structure

import { AxialCoordinates } from './coordinates.type';
import { TerrainType } from './terrain.type';

export interface TileData {
  coordinates: AxialCoordinates;
  elevation: number;
  terrain: TerrainType;
  playerSpawn?: number; // Player number (1, 2, etc.) if this tile is a spawn point
} 