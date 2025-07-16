import { createMapGenerationConfig } from '../../shared/constants/mapGeneration.const';
import { MapData, TileData } from '../../shared/types/map';
import { MapGenerationConfig, PassExecutionResult } from '../../shared/types/mapGeneration';
import { MapGenerationContext } from './mapGeneration/GenerationPass';
import { PassRegistry } from './mapGeneration/PassRegistry';

/**
 * Map generation results and statistics
 */
export interface MapGenerationResult {
  mapData: MapData;
  passResults: PassExecutionResult[];
  totalTilesGenerated: number;
  executionTimeMs: number;
}

/**
 * Enhanced MapGenerator using a pipeline-based approach
 * Supports configurable generation passes and presets
 */
export class MapGenerator {
  private config: MapGenerationConfig;
  private passRegistry: PassRegistry;

  constructor(width: number, height: number, presetName?: keyof typeof import('../../shared/constants/mapGeneration.const').MAP_GENERATION_PRESETS, seed?: string, playerCount?: number) {
    this.config = createMapGenerationConfig(width, height, presetName, seed);
    
    // If player count is specified, update the spawn allocation pass parameters
    if (playerCount !== undefined) {
      this.updateSpawnAllocationPlayerCount(playerCount);
    }
    
    this.passRegistry = PassRegistry.getInstance();
  }

  /**
   * Update the player count for the spawn allocation pass
   */
  private updateSpawnAllocationPlayerCount(playerCount: number): void {
    const spawnPassIndex = this.config.passes.findIndex(p => p.name === 'SpawnAllocation');
    if (spawnPassIndex !== -1) {
      this.config.passes[spawnPassIndex] = {
        ...this.config.passes[spawnPassIndex],
        parameters: {
          ...this.config.passes[spawnPassIndex].parameters,
          playerCount: playerCount,
        },
      };
    }
  }

  /**
   * Generate a map using the configured pipeline
   */
  public generate(): MapData {
    const result = this.generateWithDetails();
    return result.mapData;
  }

  /**
   * Generate a map with detailed execution information
   */
  public generateWithDetails(): MapGenerationResult {
    const startTime = Date.now();
    
    // Validate configuration
    const enabledPasses = this.config.passes.filter(p => p.enabled);
    const passNames = enabledPasses.map(p => p.name);
    const validation = this.passRegistry.validatePassConfiguration(passNames);
    
    if (!validation.valid) {
      throw new Error(`Missing generation passes: ${validation.missingPasses.join(', ')}`);
    }

    // Initialize generation context
    const context = new MapGenerationContext(this.config.width, this.config.height, this.config);
    const passResults: PassExecutionResult[] = [];

    // Execute passes in order
    for (const passConfig of enabledPasses) {
      const pass = this.passRegistry.getPass(passConfig.name);
      if (!pass) {
        throw new Error(`Generation pass '${passConfig.name}' not found in registry`);
      }

      const result = pass.execute(context, passConfig);
      passResults.push(result);

      if (!result.success) {
        throw new Error(`Generation pass '${passConfig.name}' failed: ${result.message}`);
      }
    }

    // Convert context tiles to final MapData format
    const flattenedTiles = context.tiles.flat();
    const validTiles = flattenedTiles.filter(t => t !== null) as TileData[];

    const mapData: MapData = {
      width: this.config.width,
      height: this.config.height,
      tiles: validTiles,
    };

    const executionTimeMs = Date.now() - startTime;
    const totalTilesGenerated = passResults.reduce((sum, result) => sum + result.tilesModified, 0);

    return {
      mapData,
      passResults,
      totalTilesGenerated,
      executionTimeMs,
    };
  }

  /**
   * Get the current generation configuration
   */
  public getConfig(): MapGenerationConfig {
    return { ...this.config };
  }

  /**
   * Update the generation configuration
   */
  public setConfig(config: Partial<MapGenerationConfig>): void {
    this.config = { ...this.config, ...config };
  }
} 