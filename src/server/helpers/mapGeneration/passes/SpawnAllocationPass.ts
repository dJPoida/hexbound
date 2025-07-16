import {
  MAP_GENERATION_PASSES,
  SPAWN_ALLOCATION_DEFAULT_PARAMS,
} from '../../../../shared/constants/mapGeneration.const';
import { TerrainType, TileData } from '../../../../shared/types/map';
import {
  MapGenerationPassConfig,
  PassExecutionResult,
} from '../../../../shared/types/mapGeneration';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';

/**
 * Parameters for the Spawn Allocation generation pass
 */
interface SpawnAllocationPassParams {
  playerCount: number;
  preferredY: 'top' | 'middle' | 'bottom' | number;
}

/**
 * Allocates spawn points for players equally spaced across the map width
 */
export class SpawnAllocationPass extends GenerationPass {
  readonly name = MAP_GENERATION_PASSES.SPAWN_ALLOCATION;

  execute(context: MapGenerationContext, config: MapGenerationPassConfig): PassExecutionResult {
    // Merge config parameters with defaults
    const params: SpawnAllocationPassParams = {
      ...SPAWN_ALLOCATION_DEFAULT_PARAMS,
      ...(config.parameters as Partial<SpawnAllocationPassParams>),
    };

    let tilesModified = 0;

    // Calculate spawn positions
    const spawnPositions = this.calculateSpawnPositions(context, params);

    // Assign spawn points to tiles
    for (let playerNum = 1; playerNum <= params.playerCount; playerNum++) {
      const position = spawnPositions[playerNum - 1];
      if (position) {
        const tile = context.getTile(position.q, position.r);
        if (tile) {
          // Update the existing tile to mark it as a spawn point
          tile.playerSpawn = playerNum;
          context.setTile(position.q, position.r, tile);
          tilesModified++;
        }
      }
    }

    return this.createResult(
      tilesModified,
      `Allocated ${tilesModified} spawn points for ${params.playerCount} players`
    );
  }

  /**
   * Calculate spawn positions equally spaced across the map width
   */
  private calculateSpawnPositions(
    context: MapGenerationContext,
    params: SpawnAllocationPassParams
  ): Array<{ q: number; r: number }> {
    const positions: Array<{ q: number; r: number }> = [];

    // Calculate Y coordinate based on preference
    let targetR: number;
    if (typeof params.preferredY === 'number') {
      targetR = Math.max(0, Math.min(context.height - 1, params.preferredY));
    } else {
      switch (params.preferredY) {
        case 'top':
          targetR = Math.floor(context.height * 0.2);
          break;
        case 'bottom':
          targetR = Math.floor(context.height * 0.8);
          break;
        case 'middle':
        default:
          targetR = Math.floor(context.height / 2);
          break;
      }
    }

    // Calculate X positions equally spaced across the width
    // For 2 players: positions at 1/3 and 2/3 of width
    // For 3 players: positions at 1/4, 1/2, 3/4 of width, etc.
    for (let playerIndex = 0; playerIndex < params.playerCount; playerIndex++) {
      const ratio = (playerIndex + 1) / (params.playerCount + 1);
      const targetQ = Math.floor(context.width * ratio);

      // Find the best suitable tile near the target position
      const bestPosition = this.findBestSpawnTile(context, targetQ, targetR);
      if (bestPosition) {
        positions.push(bestPosition);
      }
    }

    return positions;
  }

  /**
   * Find the best suitable spawn tile near the target coordinates
   * Prefers land tiles (not ocean) and avoids ice caps when possible
   */
  private findBestSpawnTile(
    context: MapGenerationContext,
    targetQ: number,
    targetR: number
  ): { q: number; r: number } | null {
    // Search in expanding rings around the target position
    for (let radius = 0; radius < Math.max(context.width, context.height) / 2; radius++) {
      for (let dq = -radius; dq <= radius; dq++) {
        for (let dr = -radius; dr <= radius; dr++) {
          // Skip positions not on the current radius ring
          if (Math.abs(dq) !== radius && Math.abs(dr) !== radius) continue;

          const q = targetQ + dq;
          const r = targetR + dr;

          // Check bounds
          if (q < 0 || q >= context.width || r < 0 || r >= context.height) continue;

          const tile = context.getTile(q, r);
          if (tile && this.isValidSpawnTile(tile)) {
            return { q, r };
          }
        }
      }
    }

    // Fallback: return target position even if not ideal
    if (targetQ >= 0 && targetQ < context.width && targetR >= 0 && targetR < context.height) {
      return { q: targetQ, r: targetR };
    }

    return null;
  }

  /**
   * Check if a tile is suitable for spawning
   */
  private isValidSpawnTile(tile: TileData): boolean {
    // Prefer grassland and avoid ocean/ice
    return tile.terrain === TerrainType.GRASSLAND || tile.terrain === TerrainType.DESERT;
  }
}
