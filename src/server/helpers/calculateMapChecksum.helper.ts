import { MapData } from '../../shared/types/game.types';

/**
 * Calculates a checksum for map data to detect changes
 * @param mapData The map data to calculate checksum for
 * @returns A hexadecimal string representing the checksum
 */
export function calculateMapChecksum(mapData: MapData): string {
  const dataString = JSON.stringify({
    width: mapData.width,
    height: mapData.height,
    tiles: mapData.tiles.map(tile => ({
      q: tile.coordinates.q,
      r: tile.coordinates.r,
      elevation: tile.elevation,
      terrain: tile.terrain,
      playerSpawn: tile.playerSpawn
    }))
  });
  
  // Simple hash function - in production you might want a more robust hash
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
} 