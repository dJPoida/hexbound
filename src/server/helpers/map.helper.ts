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
  if (rand < 0.6) return TerrainType.GRASSLAND; 
  if (rand < 0.75) return TerrainType.DESERT;
  if (rand < 0.9) return TerrainType.TUNDRA;
  if (rand < 0.98) return TerrainType.OCEAN;
  return TerrainType.ICECAP;
}

/**
 * Generates a new game map with the specified dimensions.
 * The elevation is generated using a simple random walk algorithm to create more natural terrain.
 * @param width The number of tiles from west to east.
 * @param height The number of tiles from north to south.
 * @returns A MapData object representing the newly created map.
 */
export function generateMap(width: number, height: number): MapData {
  const tiles: TileData[] = [];
  const elevationGrid: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      let baseElevation: number;
      if (r === 0 && q === 0) {
        // Start with a random elevation for the very first tile
        baseElevation = Math.floor(Math.random() * 5);
      } else if (r === 0) {
        // First row, base elevation on the tile to the west
        baseElevation = elevationGrid[r][q - 1];
      } else if (q === 0) {
        // First column, base elevation on the tile to the north
        baseElevation = elevationGrid[r - 1][q];
      } else {
        // For all other tiles, average the elevation of the west and north neighbors
        baseElevation = Math.round((elevationGrid[r][q - 1] + elevationGrid[r - 1][q]) / 2);
      }

      // Add a small random change, clamped within bounds
      const elevationChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const newElevation = Math.max(0, Math.min(4, baseElevation + elevationChange));
      
      elevationGrid[r][q] = newElevation;

      const tile: TileData = {
        coordinates: { q, r },
        elevation: newElevation,
        terrain: getRandomTerrain(), // Terrain is still random for now
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