import { TerrainType } from '../../../../shared/types/game.types';
import { PassExecutionResult, MapGenerationPassConfig } from '../../../../shared/types/mapGeneration.types';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';
import { MAP_GENERATION_PASSES, OCEAN_BAND_DEFAULT_PARAMS } from '../../../../shared/constants/mapGeneration.const';

/**
 * Parameters for the Ocean Band generation pass
 */
interface OceanBandPassParams {
  rows: readonly (number | string)[];
  elevation: number;
}

/**
 * Generates ocean bands at specified rows
 * Converted from the original MapGenerator._applyOceans() logic
 * Supports both absolute row numbers and height-relative expressions like 'height-3'
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

    // Convert row expressions to actual row numbers
    const oceanRows = this.parseRowExpressions(params.rows, context.height);

    for (const r of oceanRows) {
      // Validate row is within bounds
      if (r < 0 || r >= context.height) {
        continue;
      }

      for (let q = 0; q < context.width; q++) {
        // Skip if tile is already set by a previous pass
        if (this.shouldSkipTile(context.getTile(q, r))) {
          continue;
        }

        // Create and set the ocean tile
        const tile = context.createTile(q, r, params.elevation, TerrainType.OCEAN);
        context.setTile(q, r, tile);
        tilesModified++;
      }
    }

    return this.createResult(tilesModified, `Ocean bands applied to rows: ${oceanRows.join(', ')}`);
  }

  /**
   * Parse row expressions, converting 'height-N' strings to actual row numbers
   */
  private parseRowExpressions(rowExpressions: readonly (number | string)[], mapHeight: number): number[] {
    const oceanRows: number[] = [];

    for (const rowExpr of rowExpressions) {
      if (typeof rowExpr === 'number') {
        oceanRows.push(rowExpr);
      } else if (typeof rowExpr === 'string' && rowExpr.startsWith('height-')) {
        // Parse 'height-N' expressions
        const offsetStr = rowExpr.substring('height-'.length);
        const offset = parseInt(offsetStr, 10);
        
        if (!isNaN(offset)) {
          const actualRow = mapHeight - offset;
          oceanRows.push(actualRow);
        }
      }
      // Ignore invalid expressions
    }

    return oceanRows;
  }
} 