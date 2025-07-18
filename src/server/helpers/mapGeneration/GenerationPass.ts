import { TerrainType, TileData } from '../../../shared/types/map';
import {
  GenerationContext,
  MapGenerationConfig,
  MapGenerationPassConfig,
  PassExecutionResult,
} from '../../../shared/types/mapGeneration';

/**
 * Enhanced generation context with helper methods for passes
 */
export class MapGenerationContext implements GenerationContext {
  tiles: (TileData | null)[][];
  config: MapGenerationConfig;
  width: number;
  height: number;

  constructor(width: number, height: number, config: MapGenerationConfig) {
    this.width = width;
    this.height = height;
    this.config = config;
    this.tiles = [];

    // Initialize the 2D grid
    for (let r = 0; r < height; r++) {
      this.tiles[r] = Array(width).fill(null);
    }
  }

  /**
   * Get a tile at the specified coordinates
   */
  getTile(q: number, r: number): TileData | null {
    if (r < 0 || r >= this.height || q < 0 || q >= this.width) {
      return null; // Out of bounds
    }
    return this.tiles[r]?.[q] ?? null;
  }

  /**
   * Set a tile at the specified coordinates
   */
  setTile(q: number, r: number, tile: TileData): void {
    if (r < 0 || r >= this.height || q < 0 || q >= this.width) {
      return; // Out of bounds
    }
    this.tiles[r][q] = tile;
  }

  /**
   * Create a new tile with the specified properties
   */
  createTile(q: number, r: number, elevation: number, terrain: TerrainType): TileData {
    return {
      coordinates: { q, r },
      elevation,
      terrain,
    };
  }

  /**
   * Get the elevation of a tile (returns null if tile doesn't exist)
   */
  getTileElevation(q: number, r: number): number | null {
    const tile = this.getTile(q, r);
    return tile?.elevation ?? null;
  }

  /**
   * Get neighboring tiles (including null for out-of-bounds or unset tiles)
   * Uses correct hex adjacency for flat-top hex grid with alternating row offsets
   */
  getNeighbors(q: number, r: number): (TileData | null)[] {
    const neighbors: (TileData | null)[] = [];

    // Hex grid neighbor offsets for flat-top hexes with alternating rows
    // Even rows (r=0,2,4...): offset pattern
    // Odd rows (r=1,3,5...): different offset pattern
    const isEvenRow = r % 2 === 0;

    const offsets = isEvenRow
      ? [
          { q: 0, r: -1 }, // top
          { q: 1, r: -1 }, // top-right
          { q: 1, r: 0 }, // right
          { q: 0, r: 1 }, // bottom
          { q: -1, r: 0 }, // left
          { q: -1, r: -1 }, // top-left
        ]
      : [
          { q: 0, r: -1 }, // top
          { q: 1, r: 0 }, // top-right
          { q: 1, r: 1 }, // right
          { q: 0, r: 1 }, // bottom
          { q: -1, r: 1 }, // bottom-left
          { q: -1, r: 0 }, // left
        ];

    for (const offset of offsets) {
      neighbors.push(this.getTile(q + offset.q, r + offset.r));
    }

    return neighbors;
  }

  /**
   * Get adjacent elevations (west and north) for elevation smoothing
   */
  getAdjacentElevations(q: number, r: number): { west: number | null; north: number | null } {
    const west = this.getTileElevation(q - 1, r);
    const north = this.getTileElevation(q, r - 1);
    return { west, north };
  }

  /**
   * Count tiles that match a specific condition
   */
  countTiles(predicate: (tile: TileData | null) => boolean): number {
    let count = 0;
    for (let r = 0; r < this.height; r++) {
      for (let q = 0; q < this.width; q++) {
        if (predicate(this.tiles[r][q])) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Check if a tile has been set (is not null)
   */
  isTileSet(q: number, r: number): boolean {
    return this.getTile(q, r) !== null;
  }
}

/**
 * Abstract base class for all map generation passes
 */
export abstract class GenerationPass {
  /** Unique name identifier for this pass */
  abstract readonly name: string;

  /**
   * Execute this generation pass
   */
  abstract execute(
    context: MapGenerationContext,
    config: MapGenerationPassConfig
  ): PassExecutionResult;

  /**
   * Check if a tile should be skipped (already set by previous pass)
   */
  protected shouldSkipTile(tile: TileData | null): boolean {
    return tile !== null;
  }

  /**
   * Calculate base elevation from adjacent tiles for smooth transitions
   */
  protected calculateBaseElevation(
    context: MapGenerationContext,
    q: number,
    r: number,
    defaultElevation: number
  ): number {
    const { west, north } = context.getAdjacentElevations(q, r);

    if (west !== null && north !== null) {
      return Math.round((west + north) / 2);
    } else if (west !== null) {
      return west;
    } else if (north !== null) {
      return north;
    } else {
      return defaultElevation;
    }
  }

  /**
   * Apply elevation variation to base elevation
   */
  protected applyElevationVariation(baseElevation: number, variation: number = 1): number {
    const elevationChange = Math.floor(Math.random() * (variation * 2 + 1)) - variation; // -variation to +variation
    return Math.max(0, Math.min(4, baseElevation + elevationChange));
  }

  /**
   * Create a successful execution result
   */
  protected createResult(tilesModified: number, message?: string): PassExecutionResult {
    return {
      success: true,
      tilesModified,
      message: message || `${this.name} pass completed: ${tilesModified} tiles modified`,
    };
  }

  /**
   * Create a failed execution result
   */
  protected createFailureResult(message: string): PassExecutionResult {
    return {
      success: false,
      tilesModified: 0,
      message: `${this.name} pass failed: ${message}`,
    };
  }
}
