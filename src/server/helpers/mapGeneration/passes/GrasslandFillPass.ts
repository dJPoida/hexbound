import { GRASSLAND_FILL_DEFAULT_PARAMS,MAP_GENERATION_PASSES } from '../../../../shared/constants/mapGeneration.const';
import { TerrainType } from '../../../../shared/types/map';
import { MapGenerationPassConfig,PassExecutionResult } from '../../../../shared/types/mapGeneration';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';

/**
 * Parameters for the Grassland Fill generation pass
 */
interface GrasslandFillPassParams {
  defaultElevation: number;
  elevationVariation: number;
  minElevation: number;
  maxElevation: number;
}

/**
 * Fills remaining unset tiles with grassland terrain
 * Converted from the original MapGenerator._fillGrassland() logic
 */
export class GrasslandFillPass extends GenerationPass {
  readonly name = MAP_GENERATION_PASSES.GRASSLAND_FILL;

  execute(context: MapGenerationContext, config: MapGenerationPassConfig): PassExecutionResult {
    // Merge config parameters with defaults
    const params: GrasslandFillPassParams = {
      ...GRASSLAND_FILL_DEFAULT_PARAMS,
      ...(config.parameters as Partial<GrasslandFillPassParams>),
    };

    let tilesModified = 0;

    for (let r = 0; r < context.height; r++) {
      for (let q = 0; q < context.width; q++) {
        // Skip if tile is already set by a previous pass
        if (this.shouldSkipTile(context.getTile(q, r))) {
          continue;
        }

        // Calculate base elevation using adjacent tiles for smooth transitions
        const baseElevation = this.calculateBaseElevation(context, q, r, params.defaultElevation);

        // Apply elevation variation
        const finalElevation = this.applyElevationVariation(baseElevation, params.elevationVariation);
        
        // Ensure elevation is within the specified range
        const clampedElevation = Math.max(params.minElevation, Math.min(params.maxElevation, finalElevation));

        // Create and set the grassland tile
        const tile = context.createTile(q, r, clampedElevation, TerrainType.GRASSLAND);
        context.setTile(q, r, tile);
        tilesModified++;
      }
    }

    return this.createResult(tilesModified, `Grassland terrain applied to remaining unset tiles`);
  }
} 