// Map generation context

import { TileData } from '../map/tile.type';
import { MapGenerationConfig } from './config.type';

/**
 * Context object passed to generation passes during execution
 */
export interface GenerationContext {
  /** 2D grid of tiles (null = unset) */
  tiles: (TileData | null)[][];
  /** Generation configuration */
  config: MapGenerationConfig;
  /** Map width for convenience */
  width: number;
  /** Map height for convenience */
  height: number;
} 