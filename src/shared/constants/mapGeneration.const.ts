import { MapGenerationConfig, MapGenerationPreset, MapGenerationPassConfig } from '../types/mapGeneration.types';

/**
 * Map generation pass names (enum-like constants)
 */
export const MAP_GENERATION_PASSES = {
  ICE_CAP: 'IceCap',
  OCEAN_BAND: 'OceanBand', 
  GRASSLAND_FILL: 'GrasslandFill',
  SPAWN_ALLOCATION: 'SpawnAllocation',
} as const;

/**
 * Default parameters for Ice Cap pass
 */
export const ICE_CAP_DEFAULT_PARAMS = {
  topRows: 2,
  bottomRows: 2,
  minElevation: 2,
  maxElevation: 4,
  elevationVariation: 1,
} as const;

/**
 * Default parameters for Ocean Band pass
 */
export const OCEAN_BAND_DEFAULT_PARAMS = {
  rows: [2, 'height-3'], // Can include numbers or 'height-N' expressions
  elevation: 0,
} as const;

/**
 * Default parameters for Grassland Fill pass
 */
export const GRASSLAND_FILL_DEFAULT_PARAMS = {
  defaultElevation: 1,
  elevationVariation: 1,
  minElevation: 0,
  maxElevation: 4,
} as const;

/**
 * Default parameters for Spawn Allocation pass
 */
export const SPAWN_ALLOCATION_DEFAULT_PARAMS = {
  playerCount: 2,
  preferredY: 'middle', // Can be 'top', 'middle', 'bottom', or a specific row number
} as const;

/**
 * Basic world configuration matching current implementation
 */
export const BASIC_WORLD_PASSES: MapGenerationPassConfig[] = [
  {
    name: MAP_GENERATION_PASSES.ICE_CAP,
    enabled: true,
    parameters: ICE_CAP_DEFAULT_PARAMS,
  },
  {
    name: MAP_GENERATION_PASSES.OCEAN_BAND,
    enabled: true,
    parameters: OCEAN_BAND_DEFAULT_PARAMS,
  },
  {
    name: MAP_GENERATION_PASSES.GRASSLAND_FILL,
    enabled: true,
    parameters: GRASSLAND_FILL_DEFAULT_PARAMS,
  },
  {
    name: MAP_GENERATION_PASSES.SPAWN_ALLOCATION,
    enabled: true,
    parameters: SPAWN_ALLOCATION_DEFAULT_PARAMS,
  },
];

/**
 * Ocean world configuration (mostly water)
 */
export const OCEAN_WORLD_PASSES: MapGenerationPassConfig[] = [
  {
    name: MAP_GENERATION_PASSES.ICE_CAP,
    enabled: true,
    parameters: {
      ...ICE_CAP_DEFAULT_PARAMS,
      topRows: 1,
      bottomRows: 1,
    },
  },
  {
    name: MAP_GENERATION_PASSES.OCEAN_BAND,
    enabled: true,
    parameters: {
      rows: [1, 2, 3, 4, 'height-5', 'height-4', 'height-3', 'height-2'],
      elevation: 0,
    },
  },
  {
    name: MAP_GENERATION_PASSES.GRASSLAND_FILL,
    enabled: true,
    parameters: GRASSLAND_FILL_DEFAULT_PARAMS,
  },
  {
    name: MAP_GENERATION_PASSES.SPAWN_ALLOCATION,
    enabled: true,
    parameters: SPAWN_ALLOCATION_DEFAULT_PARAMS,
  },
];

/**
 * Map generation presets
 */
export const MAP_GENERATION_PRESETS: Record<string, MapGenerationPreset> = {
  BASIC_WORLD: {
    name: 'Basic World',
    description: 'Standard world with ice caps, ocean bands, and grassland continents',
    config: {
      passes: BASIC_WORLD_PASSES,
    },
  },
  OCEAN_WORLD: {
    name: 'Ocean World',
    description: 'Mostly water world with small landmasses',
    config: {
      passes: OCEAN_WORLD_PASSES,
    },
  },
} as const;

/**
 * Default preset to use when none is specified
 */
export const DEFAULT_MAP_PRESET = MAP_GENERATION_PRESETS.BASIC_WORLD;

/**
 * Helper function to create a complete map generation config
 */
export const createMapGenerationConfig = (
  width: number,
  height: number,
  presetName?: keyof typeof MAP_GENERATION_PRESETS,
  seed?: string
): MapGenerationConfig => {
  const preset = presetName ? MAP_GENERATION_PRESETS[presetName] : DEFAULT_MAP_PRESET;
  
  return {
    width,
    height,
    seed,
    passes: preset.config.passes,
  };
}; 