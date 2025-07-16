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
