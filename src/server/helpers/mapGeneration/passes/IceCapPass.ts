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
 * Generates ice cap regions at the top and bottom of the map
 * Converted from the original MapGenerator._applyIceCaps() logic
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

    for (let r = 0; r < context.height; r++) {
      // Check if this row should have ice caps
      const isTopIceCap = r < params.topRows;
      const isBottomIceCap = r >= context.height - params.bottomRows;

      if (!isTopIceCap && !isBottomIceCap) {
        continue; // Skip rows that shouldn't have ice caps
      }

      for (let q = 0; q < context.width; q++) {
        // Skip if tile is already set by a previous pass
        if (this.shouldSkipTile(context.getTile(q, r))) {
          continue;
        }

        // Calculate base elevation using adjacent tiles for smooth transitions
        const baseElevation = this.calculateBaseElevation(
          context,
          q,
          r,
          params.minElevation +
            Math.floor(Math.random() * (params.maxElevation - params.minElevation + 1))
        );

        // Apply elevation variation
        const finalElevation = this.applyElevationVariation(
          baseElevation,
          params.elevationVariation
        );

        // Ensure ice caps are within the specified elevation range
        const clampedElevation = Math.max(
          params.minElevation,
          Math.min(params.maxElevation, finalElevation)
        );

        // Create and set the ice cap tile
        const tile = context.createTile(q, r, clampedElevation, TerrainType.ICECAP);
        context.setTile(q, r, tile);
        tilesModified++;
      }
    }

    return this.createResult(
      tilesModified,
      `Ice caps applied to ${params.topRows} top and ${params.bottomRows} bottom rows`
    );
  }
}
