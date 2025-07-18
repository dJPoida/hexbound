import {
  ICE_CAP_DEFAULT_PARAMS,
  MAP_GENERATION_PASSES,
} from '../../../../shared/constants/mapGeneration.const';
import { TerrainType } from '../../../../shared/types/map';
import {
  MapGenerationPassConfig,
  PassExecutionResult,
} from '../../../../shared/types/mapGeneration';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';

/**
 * Parameters for the Ice Cap generation pass
 */
interface IceCapPassParams {
  topRows: number;
  bottomRows: number;
  minElevation: number;
  maxElevation: number;
  elevationVariation: number;
}

/**
 * Generates natural ice cap formations at the top and bottom of the map
 * Creates connected ice formations with decreasing probability as distance from edge increases
 */
export class IceCapPass extends GenerationPass {
  readonly name = MAP_GENERATION_PASSES.ICE_CAP;

  execute(context: MapGenerationContext, config: MapGenerationPassConfig): PassExecutionResult {
    // Merge config parameters with defaults
    const params: IceCapPassParams = {
      ...ICE_CAP_DEFAULT_PARAMS,
      ...(config.parameters as Partial<IceCapPassParams>),
    };

    let tilesModified = 0;

    // Generate top ice caps (rows 0-3)
    tilesModified += this.generateIceFormation(context, params, true);

    // Generate bottom ice caps (rows height-4 to height-1)
    tilesModified += this.generateIceFormation(context, params, false);

    return this.createResult(
      tilesModified,
      `Natural ice formations generated at top and bottom of map`
    );
  }

  /**
   * Generate ice formations for either top or bottom of map
   */
  private generateIceFormation(
    context: MapGenerationContext,
    params: IceCapPassParams,
    isTop: boolean
  ): number {
    let tilesModified = 0;
    const maxDepth = 6; // Maximum rows of ice formation

    // Determine row range based on top/bottom
    const startRow = isTop ? 0 : context.height - maxDepth;
    const endRow = isTop ? Math.min(maxDepth, context.height) : context.height;

    // Rows 0-1 (or bottom 2 rows) - 100% ice coverage (solid barrier)
    for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
      const r = isTop ? rowOffset : context.height - 1 - rowOffset;

      // Skip if row is out of bounds
      if (r < 0 || r >= context.height) {
        continue;
      }

      for (let q = 0; q < context.width; q++) {
        if (this.shouldSkipTile(context.getTile(q, r))) {
          continue;
        }

        const elevation = this.calculateIceElevation(context, q, r, params);
        const tile = context.createTile(q, r, elevation, TerrainType.ICECAP);
        context.setTile(q, r, tile);
        tilesModified++;
      }
    }

    // Generate ice formations for rows 2-4 (natural extensions)
    for (let rowOffset = 2; rowOffset < maxDepth; rowOffset++) {
      const r = isTop ? rowOffset : context.height - 1 - rowOffset;

      // Skip if row is out of bounds
      if (r < 0 || r >= context.height) {
        continue;
      }

      // Determine ice formation probability based on row depth
      const iceChance = this.getIceFormationChance(rowOffset);

      for (let q = 0; q < context.width; q++) {
        if (this.shouldSkipTile(context.getTile(q, r))) {
          continue;
        }

        // Check if this tile is adjacent to existing ice
        if (this.isAdjacentToIce(context, q, r)) {
          // Roll for ice formation based on depth probability
          if (Math.random() < iceChance) {
            const elevation = this.calculateIceElevation(context, q, r, params);
            const tile = context.createTile(q, r, elevation, TerrainType.ICECAP);
            context.setTile(q, r, tile);
            tilesModified++;
          }
        }
      }
    }

    return tilesModified;
  }

  /**
   * Check if a tile is adjacent to any ice tile (six-way adjacency)
   */
  private isAdjacentToIce(context: MapGenerationContext, q: number, r: number): boolean {
    const neighbors = context.getNeighbors(q, r);
    return neighbors.some(neighbor => neighbor?.terrain === TerrainType.ICECAP);
  }

  /**
   * Get ice formation probability based on row depth from edge
   */
  private getIceFormationChance(rowDepth: number): number {
    switch (rowDepth) {
      case 2:
        return 0.6; // 60% chance for row 2
      case 3:
        return 0.25; // 25% chance for row 3
      case 4:
        return 0.035; // 3.5% chance for row 4
      default:
        return 0; // No ice beyond row 4
    }
  }

  /**
   * Calculate elevation for ice tile with proper ice wall gradient
   */
  private calculateIceElevation(
    context: MapGenerationContext,
    q: number,
    r: number,
    params: IceCapPassParams
  ): number {
    // Rows 0-1 always have elevation 4 (solid high barrier)
    if (r <= 1 || r >= context.height - 2) {
      return 4;
    }

    // For other rows, calculate based on adjacent ice tiles above
    const adjacentElevations = this.getAdjacentIceElevations(context, q, r);

    if (adjacentElevations.length === 0) {
      // No adjacent ice tiles above, use minimum elevation
      return params.minElevation;
    }

    // Find the highest elevation among adjacent tiles above
    const maxAdjacentElevation = Math.max(...adjacentElevations);

    // Ice tile cannot be higher than adjacent tiles above
    // Apply some variation but ensure it's not higher than max adjacent
    const baseElevation = Math.min(maxAdjacentElevation, params.maxElevation);

    // Apply small variation (0 to -1) to create natural slope
    const elevationVariation = Math.floor(Math.random() * 2); // 0 or -1
    const finalElevation = Math.max(params.minElevation, baseElevation - elevationVariation);

    return finalElevation;
  }

  /**
   * Get elevations of adjacent ice tiles above the current position
   */
  private getAdjacentIceElevations(context: MapGenerationContext, q: number, r: number): number[] {
    const elevations: number[] = [];
    const neighbors = context.getNeighbors(q, r);

    // Check all neighbors for ice tiles
    for (const neighbor of neighbors) {
      if (neighbor?.terrain === TerrainType.ICECAP) {
        elevations.push(neighbor.elevation);
      }
    }

    return elevations;
  }
}
