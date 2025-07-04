import { TileData } from './game.types';

/**
 * Configuration for individual map generation passes
 */
export interface MapGenerationPassConfig {
  /** Unique identifier for the pass */
  name: string;
  /** Whether this pass should be executed */
  enabled: boolean;
  /** Pass-specific parameters */
  parameters: Record<string, unknown>;
}

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

/**
 * Result returned by generation passes
 */
export interface PassExecutionResult {
  /** Whether the pass executed successfully */
  success: boolean;
  /** Number of tiles modified by this pass */
  tilesModified: number;
  /** Optional message about pass execution */
  message?: string;
}

/**
 * Preset configurations for common map types
 */
export interface MapGenerationPreset {
  /** Preset name */
  name: string;
  /** Description of this preset */
  description: string;
  /** Base configuration (width/height can be overridden) */
  config: Omit<MapGenerationConfig, 'width' | 'height'>;
} 