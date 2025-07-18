import {
  ICE_CAP_WALL_BALANCING_DEFAULT_PARAMS,
  MAP_GENERATION_PASSES,
} from '../../../../shared/constants/mapGeneration.const';
import { TerrainType } from '../../../../shared/types/map';
import {
  MapGenerationPassConfig,
  PassExecutionResult,
} from '../../../../shared/types/mapGeneration';
import { GenerationPass, MapGenerationContext } from '../GenerationPass';

export interface IceCapWallBalancingPassParams {
  targetElevation: number;
}

/**
 * Ice Cap Wall Balancing Pass
 *
 * Ensures that ice cap tiles at the edges of ice cap formations have a consistent elevation.
 * This creates a balanced wall effect by setting edge ice caps to elevation 2.
 *
 * Algorithm:
 * 1. Iterate over every column (q) in the map
 * 2. For each column, start at the center and scan upward until an ice cap is found
 * 3. Set that ice cap's elevation to 2
 * 4. Return to center and scan downward until an ice cap is found
 * 5. Set that ice cap's elevation to 2
 * 6. Move to next column and repeat
 */
export class IceCapWallBalancingPass extends GenerationPass {
  readonly name = MAP_GENERATION_PASSES.ICE_CAP_WALL_BALANCING;

  execute(context: MapGenerationContext, config: MapGenerationPassConfig): PassExecutionResult {
    const params = config.parameters as unknown as IceCapWallBalancingPassParams;
    let tilesModified = 0;

    // Calculate the center row of the map
    const centerRow = Math.floor(context.height / 2);

    // Iterate over every column in the map
    for (let q = 0; q < context.width; q++) {
      let upperIceCapFound = false;
      let lowerIceCapFound = false;

      // Scan upward from center until an ice cap is found (skip top row only)
      for (let r = centerRow; r >= 1; r--) {
        const tile = context.getTile(q, r);
        if (tile && tile.terrain === TerrainType.ICECAP) {
          // Found an ice cap, ensure it has the target elevation
          if (tile.elevation !== params.targetElevation) {
            tile.elevation = params.targetElevation;
            tilesModified++;
          }

          // Create smooth gradient upward
          let currentElevation = tile.elevation;
          let currentRow = r - 1;
          while (currentRow >= 0) {
            const nextTile = context.getTile(q, currentRow);
            if (nextTile && nextTile.terrain === TerrainType.ICECAP) {
              const elevationDiff = Math.abs(nextTile.elevation - currentElevation);
              if (elevationDiff > 1) {
                nextTile.elevation = currentElevation + 1;
                tilesModified++;
              }
              currentElevation = nextTile.elevation;
              currentRow--;
            } else {
              break; // No more ice caps in this direction
            }
          }

          upperIceCapFound = true;
          break;
        }
      }

      // Scan downward from center until an ice cap is found (skip bottom row only)
      for (let r = centerRow; r < context.height - 1; r++) {
        const tile = context.getTile(q, r);
        if (tile && tile.terrain === TerrainType.ICECAP) {
          // Found an ice cap, ensure it has the target elevation
          if (tile.elevation !== params.targetElevation) {
            tile.elevation = params.targetElevation;
            tilesModified++;
          }

          // Create smooth gradient downward
          let currentElevation = tile.elevation;
          let currentRow = r + 1;
          while (currentRow < context.height) {
            const nextTile = context.getTile(q, currentRow);
            if (nextTile && nextTile.terrain === TerrainType.ICECAP) {
              const elevationDiff = Math.abs(nextTile.elevation - currentElevation);
              if (elevationDiff > 1) {
                nextTile.elevation = currentElevation + 1;
                tilesModified++;
              }
              currentElevation = nextTile.elevation;
              currentRow++;
            } else {
              break; // No more ice caps in this direction
            }
          }

          lowerIceCapFound = true;
          break;
        }
      }
    }

    return this.createResult(
      tilesModified,
      `Ice cap wall balancing: ${tilesModified} edge ice caps set to elevation ${params.targetElevation}`
    );
  }
}
