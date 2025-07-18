import {
  MAP_GENERATION_PASSES,
  OCEAN_BAND_DEFAULT_PARAMS,
} from '../../../../shared/constants/mapGeneration.const';
import { TerrainType } from '../../../../shared/types/map';
import {
  MapGenerationPassConfig,
  PassExecutionResult,
} from '../../../../shared/types/mapGeneration';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';

/**
 * Parameters for the Ocean Band generation pass
 */
interface OceanBandPassParams {
  elevation: number;
}

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

    // Find all ice cap tiles and generate ocean around their exposed faces
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

    // Also fill gaps between ice cap formations with ocean
    tilesModified += this.fillGapsWithOcean(context, params, oceanTiles);

    return this.createResult(
      tilesModified,
      `Dynamic ocean generation: ${tilesModified} ocean tiles placed around ice cap formations`
    );
  }

  /**
   * Generate ocean tiles around a specific ice cap tile
   * Places ocean on faces that are not connected to other ice cap tiles
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

      if (!neighbor) {
        // This neighbor position is out of bounds, skip
        continue;
      }

      // Place ocean if this neighbor is not an ice cap (or is null/undefined)
      if (!neighbor || neighbor.terrain !== TerrainType.ICECAP) {
        // Calculate the neighbor coordinates
        const neighborCoords = this.getNeighborCoordinates(q, r, i, context);
        if (!neighborCoords) continue; // Skip if out of bounds

        const neighborKey = `${neighborCoords.q},${neighborCoords.r}`;

        // Only place ocean if this tile hasn't been processed yet
        if (!oceanTiles.has(neighborKey)) {
          // Create ocean tile
          const oceanTile = context.createTile(
            neighborCoords.q,
            neighborCoords.r,
            params.elevation,
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

  /**
   * Fill gaps between ice cap formations with ocean tiles
   */
  private fillGapsWithOcean(
    context: MapGenerationContext,
    params: OceanBandPassParams,
    oceanTiles: Set<string>
  ): number {
    let tilesModified = 0;

    // Scan each row and fill gaps between ice cap tiles with ocean
    for (let r = 0; r < context.height; r++) {
      let inIceCapRegion = false;
      let lastIceCapQ = -1;

      for (let q = 0; q < context.width; q++) {
        const tile = context.getTile(q, r);

        if (tile?.terrain === TerrainType.ICECAP) {
          // We found an ice cap tile
          if (!inIceCapRegion) {
            inIceCapRegion = true;
          }
          lastIceCapQ = q;
        } else {
          // This is not an ice cap tile
          if (inIceCapRegion) {
            // We're in a gap between ice cap tiles, place ocean
            const tileKey = `${q},${r}`;
            if (!oceanTiles.has(tileKey)) {
              const oceanTile = context.createTile(q, r, params.elevation, TerrainType.OCEAN);
              context.setTile(q, r, oceanTile);
              oceanTiles.add(tileKey);
              tilesModified++;
            }
          }
        }
      }
    }

    return tilesModified;
  }

  /**
   * Calculate the coordinates of a neighbor at a specific direction index
   */
  private getNeighborCoordinates(
    q: number,
    r: number,
    directionIndex: number,
    context: MapGenerationContext
  ): { q: number; r: number } | null {
    // The six neighbor offsets for flat-top hex grid
    const offsets = [
      [0, -1], // North
      [1, -1], // Northeast (odd rows)
      [1, 0], // Southeast (odd rows)
      [0, 1], // South
      [-1, 0], // Southwest (odd rows)
      [-1, -1], // Northwest (odd rows)
    ];

    const [dq, dr] = offsets[directionIndex];
    const neighborQ = q + dq;
    const neighborR = r + dr;

    // Check bounds
    if (
      neighborQ < 0 ||
      neighborQ >= context.width ||
      neighborR < 0 ||
      neighborR >= context.height
    ) {
      return null;
    }

    return { q: neighborQ, r: neighborR };
  }
}
