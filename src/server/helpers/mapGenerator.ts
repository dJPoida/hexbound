import { MapData, TileData, TerrainType, AxialCoordinates } from '../../shared/types/game.types';

export class MapGenerator {
  private width: number;
  private height: number;
  private tiles: TileData[][] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private _initializeGrid(): void {
    for (let r = 0; r < this.height; r++) {
      this.tiles[r] = [];
      for (let q = 0; q < this.width; q++) {
        this.tiles[r][q] = {
          coordinates: { q, r },
          elevation: 0, // Default elevation
          terrain: TerrainType.GRASSLAND, // Placeholder
        };
      }
    }
  }

  private _getNeighborElevation(q: number, r: number): number | null {
    if (r < 0 || r >= this.height || q < 0 || q >= this.width) {
      return null; // Out of bounds
    }
    // Return a default or initial value if the tile hasn't been processed yet
    return this.tiles[r]?.[q]?.elevation ?? null;
  }

  private _applyIceCaps(): void {
    for (let r = 0; r < this.height; r++) {
      if (r < 2 || r >= this.height - 2) {
        for (let q = 0; q < this.width; q++) {
          let baseElevation: number;
          const west = this._getNeighborElevation(q - 1, r);
          const north = this._getNeighborElevation(q, r - 1);

          if (west !== null && north !== null) {
            baseElevation = Math.round((west + north) / 2);
          } else if (west !== null) {
            baseElevation = west;
          } else if (north !== null) {
            baseElevation = north;
          } else {
            baseElevation = Math.floor(Math.random() * 3) + 2; // Ice caps are higher elevation
          }
          
          const elevationChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          const newElevation = Math.max(2, Math.min(4, baseElevation + elevationChange));

          this.tiles[r][q] = {
            coordinates: { q, r },
            elevation: newElevation,
            terrain: TerrainType.ICECAP,
          };
        }
      }
    }
  }

  private _applyOceans(): void {
    const oceanRows = [2, this.height - 3];
    for (const r of oceanRows) {
      for (let q = 0; q < this.width; q++) {
        this.tiles[r][q] = {
          coordinates: { q, r },
          elevation: 0, // Oceans are always at sea level
          terrain: TerrainType.OCEAN,
        };
      }
    }
  }

  private _fillGrassland(): void {
    // Step 3: Logic to fill remaining tiles with grassland will go here
  }

  public generate(): MapData {
    this._initializeGrid();
    this._applyIceCaps();
    this._applyOceans();
    // this._fillGrassland();

    // Flatten the 2D grid into a 1D array for the final MapData object
    const flattenedTiles = this.tiles.flat();

    return {
      width: this.width,
      height: this.height,
      tiles: flattenedTiles,
    };
  }
} 