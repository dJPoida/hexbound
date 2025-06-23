import {
  MapData,
  TileData,
  TerrainType,
} from '../../shared/types/game.types';

/**
 * Generates a random terrain type, with a strong bias towards grassland.
 * @returns A random TerrainType.
 */
function getRandomTerrain(): TerrainType {
  const rand = Math.random();
  if (rand < 0.8) return TerrainType.GRASSLAND; // 80% chance for Grassland
  if (rand < 0.9) return TerrainType.PLAINS; // 10% chance for Plains
  if (rand < 0.95) return TerrainType.DESERT; // 5% chance for Desert
  return TerrainType.TUNDRA; // 5% chance for Tundra
}

/**
 * Generates a new game map with the specified dimensions.
 * @param width The number of tiles from west to east.
 * @param height The number of tiles from north to south.
 * @returns A MapData object representing the newly created map.
 */
export function generateMap(width: number, height: number): MapData {
  const tiles: TileData[] = [];

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const tile: TileData = {
        coordinates: { q, r },
        elevation: Math.floor(Math.random() * 5), // Random elevation from 0 to 4
        terrain: getRandomTerrain(),
      };
      tiles.push(tile);
    }
  }

  return {
    width,
    height,
    tiles,
  };
} 