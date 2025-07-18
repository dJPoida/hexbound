import { AxialCoordinates } from '../types/map';

/**
 * Calculate the six adjacent tile coordinates for a given tile position
 * Based on the hex grid adjacency patterns documented in Tile Adjacency.md
 *
 * @param q - Column coordinate (q-axis)
 * @param r - Row coordinate (r-axis)
 * @param width - Map width for q-axis wrapping
 * @param height - Map height for r-axis bounds checking
 * @returns Array of 6 adjacent coordinates, or null for out-of-bounds positions
 */
export function getNeighborCoordinates(
  q: number,
  r: number,
  width: number,
  height: number
): (AxialCoordinates | null)[] {
  const neighbors: (AxialCoordinates | null)[] = [];

  // Determine if row and column are even or odd
  const isEvenRow = r % 2 === 0;
  const isEvenColumn = q % 2 === 0;

  let offsets: Array<{ q: number; r: number }>;

  if (isEvenRow && isEvenColumn) {
    // Even row, even column
    offsets = [
      { q: 0, r: -1 }, // top
      { q: 1, r: -1 }, // top-right
      { q: 1, r: 0 }, // bottom-right
      { q: 0, r: 1 }, // bottom
      { q: -1, r: 0 }, // bottom-left
      { q: -1, r: -1 }, // top-left
    ];
  } else if (isEvenRow && !isEvenColumn) {
    // Even row, odd column
    offsets = [
      { q: 0, r: -1 }, // top
      { q: 1, r: 0 }, // top-right
      { q: 1, r: 1 }, // bottom-right
      { q: 0, r: 1 }, // bottom
      { q: -1, r: 1 }, // bottom-left
      { q: -1, r: 0 }, // top-left
    ];
  } else if (!isEvenRow && isEvenColumn) {
    // Odd row, even column
    offsets = [
      { q: 0, r: -1 }, // top
      { q: 1, r: -1 }, // top-right
      { q: 1, r: 0 }, // bottom-right
      { q: 0, r: 1 }, // bottom
      { q: -1, r: 0 }, // bottom-left
      { q: -1, r: -1 }, // top-left
    ];
  } else {
    // Odd row, odd column
    offsets = [
      { q: 0, r: -1 }, // top
      { q: 1, r: 0 }, // top-right
      { q: 1, r: 1 }, // bottom-right
      { q: 0, r: 1 }, // bottom
      { q: -1, r: 1 }, // bottom-left
      { q: -1, r: 0 }, // top-left
    ];
  }

  for (const offset of offsets) {
    let neighborQ = q + offset.q;
    const neighborR = r + offset.r;

    // Handle q-axis wrapping (the map wraps horizontally)
    if (neighborQ < 0) {
      neighborQ = width + neighborQ; // Wrap to the right edge
    } else if (neighborQ >= width) {
      neighborQ = neighborQ - width; // Wrap to the left edge
    }

    // Check r-axis bounds (no wrapping on r-axis)
    if (neighborR < 0 || neighborR >= height) {
      neighbors.push(null); // Out of bounds
    } else {
      neighbors.push({ q: neighborQ, r: neighborR });
    }
  }

  return neighbors;
}
