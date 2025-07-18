import {
  MAP_GENERATION_PASSES,
  OCEAN_BAND_DEFAULT_PARAMS,
} from '../../../../shared/constants/mapGeneration.const';
import { getNeighborCoordinates } from '../../../../shared/helpers/getNeighbors.helper';
import { TerrainType } from '../../../../shared/types/map';
import {
  MapGenerationPassConfig,
  PassExecutionResult,
} from '../../../../shared/types/mapGeneration';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';

/**
 * Parameters for the Ocean Band generation pass
 */
type OceanBandPassParams = Record<string, never>; // Ocean tiles are always at elevation 0

/**
 * Generates ocean tiles dynamically based on ice cap formations
 * Places ocean tiles adjacent to exposed ice cap faces, creating natural coastlines
 * Assumes this pass runs after the IceCap pass
 */
export class OceanBandPass extends GenerationPass {
  readonly name = MAP_GENERATION_PASSES.OCEAN_BAND;

  execute(context: MapGenerationContext, config: MapGenerationPassConfig): PassExecutionResult {
    // Merge config parameters with defaults
    const params: OceanBandPassParams = {
      ...OCEAN_BAND_DEFAULT_PARAMS,
      ...(config.parameters as Partial<OceanBandPassParams>),
    };

    let tilesModified = 0;
    const oceanTiles = new Set<string>(); // Track ocean tiles to avoid duplicates

    // Simple algorithm: iterate over the map, find ice cap tiles, check neighbors
    for (let r = 0; r < context.height; r++) {
      for (let q = 0; q < context.width; q++) {
        const tile = context.getTile(q, r);

        if (tile?.terrain === TerrainType.ICECAP) {
          // Generate ocean around this ice cap tile
          const oceanCount = this.generateOceanAroundIceCap(context, q, r, params, oceanTiles);
          tilesModified += oceanCount;
        }
      }
    }

    return this.createResult(
      tilesModified,
      `Dynamic ocean generation: ${tilesModified} ocean tiles placed around ice cap formations`
    );
  }

  /**
   * Generate ocean tiles around a specific ice cap tile
   * Simple: if neighbor is not ice cap or ocean, make it ocean
   */
  private generateOceanAroundIceCap(
    context: MapGenerationContext,
    q: number,
    r: number,
    params: OceanBandPassParams,
    oceanTiles: Set<string>
  ): number {
    let oceanTilesPlaced = 0;
    const neighbors = context.getNeighbors(q, r);

    // Check each of the 6 adjacent positions
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];

      // Get the neighbor coordinates using the shared helper
      const neighborCoords = getNeighborCoordinates(q, r, context.width, context.height)[i];
      if (!neighborCoords) {
        continue; // Skip if out of bounds
      }

      const neighborKey = `${neighborCoords.q},${neighborCoords.r}`;

      // Simple rule: if neighbor is not ice cap or ocean, make it ocean
      if (
        !neighbor ||
        (neighbor.terrain !== TerrainType.ICECAP && neighbor.terrain !== TerrainType.OCEAN)
      ) {
        // Only place ocean if this tile hasn't been processed yet
        if (!oceanTiles.has(neighborKey)) {
          // Create ocean tile (always elevation 0)
          const oceanTile = context.createTile(
            neighborCoords.q,
            neighborCoords.r,
            0,
            TerrainType.OCEAN
          );
          context.setTile(neighborCoords.q, neighborCoords.r, oceanTile);
          oceanTiles.add(neighborKey);
          oceanTilesPlaced++;
        }
      }
    }

    return oceanTilesPlaced;
  }
}
