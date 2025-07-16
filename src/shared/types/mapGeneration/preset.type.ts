// Map generation presets

import { MapGenerationConfig } from './config.type';

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