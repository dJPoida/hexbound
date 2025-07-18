import { getNeighborCoordinates } from '../../../shared/helpers/getNeighbors.helper';
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
   * Handles q-axis wrapping (horizontal wrap-around)
   */
  getTile(q: number, r: number): TileData | null {
    if (r < 0 || r >= this.height) {
      return null; // Out of bounds on r-axis (no wrapping)
    }

    // Handle q-axis wrapping (the map wraps horizontally)
    let wrappedQ = q;
    if (wrappedQ < 0) {
      wrappedQ = this.width + wrappedQ; // Wrap to the right edge
    } else if (wrappedQ >= this.width) {
      wrappedQ = wrappedQ - this.width; // Wrap to the left edge
    }

    return this.tiles[r]?.[wrappedQ] ?? null;
  }

  /**
   * Set a tile at the specified coordinates
   * Handles q-axis wrapping (horizontal wrap-around)
   */
  setTile(q: number, r: number, tile: TileData): void {
    if (r < 0 || r >= this.height) {
      return; // Out of bounds on r-axis (no wrapping)
    }

    // Handle q-axis wrapping (the map wraps horizontally)
    let wrappedQ = q;
    if (wrappedQ < 0) {
      wrappedQ = this.width + wrappedQ; // Wrap to the right edge
    } else if (wrappedQ >= this.width) {
      wrappedQ = wrappedQ - this.width; // Wrap to the left edge
    }

    this.tiles[r][wrappedQ] = tile;
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
   * Uses correct hex adjacency for flat-top hex grid with alternating row/column offsets
   * Handles q-axis wrapping (horizontal wrap-around)
   */
  getNeighbors(q: number, r: number): (TileData | null)[] {
    const neighborCoords = getNeighborCoordinates(q, r, this.width, this.height);
    return neighborCoords.map(coord => (coord ? this.getTile(coord.q, coord.r) : null));
  }

  /**
   * Get adjacent elevations (west and north) for elevation smoothing
   * Handles q-axis wrapping (horizontal wrap-around)
   */
  getAdjacentElevations(q: number, r: number): { west: number | null; north: number | null } {
    const west = this.getTileElevation(q - 1, r); // getTileElevation uses getTile which now handles wrapping
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
