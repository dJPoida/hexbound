// Map generation configuration

import { MapGenerationPassConfig } from './pass.type';

/**
 * Overall configuration for map generation
 */
export interface MapGenerationConfig {
  /** Map width in tiles */
  width: number;
  /** Map height in tiles */
  height: number;
  /** Optional seed for reproducible generation */
  seed?: string;
  /** List of generation passes to execute in order */
  passes: MapGenerationPassConfig[];
}
