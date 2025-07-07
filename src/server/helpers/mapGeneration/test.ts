import { TerrainType } from '../../../shared/types/game.types';
import { MapGenerator } from '../mapGenerator';

/**
 * Simple test to verify the refactored map generation system works correctly
 * This can be run to validate that the new pipeline produces valid maps
 */
export function testMapGeneration(): void {
  console.log('[MapGeneration Test] Starting test...');

  try {
    // Test 1: Basic map generation with default preset
    console.log('[Test 1] Testing basic map generation...');
    const generator = new MapGenerator(50, 30);
    const result = generator.generateWithDetails();
    
    console.log(`[Test 1] Generated map: ${result.mapData.width}x${result.mapData.height}`);
    console.log(`[Test 1] Total tiles: ${result.mapData.tiles.length}`);
    console.log(`[Test 1] Execution time: ${result.executionTimeMs}ms`);
    console.log(`[Test 1] Passes executed: ${result.passResults.length}`);
    
    // Validate basic structure
    if (result.mapData.width !== 50 || result.mapData.height !== 30) {
      throw new Error('Map dimensions incorrect');
    }
    
    if (result.mapData.tiles.length !== 50 * 30) {
      throw new Error(`Expected ${50 * 30} tiles, got ${result.mapData.tiles.length}`);
    }

    // Test 2: Validate terrain types are as expected
    console.log('[Test 2] Validating terrain distribution...');
    const terrainCounts = {
      [TerrainType.ICECAP]: 0,
      [TerrainType.OCEAN]: 0,
      [TerrainType.GRASSLAND]: 0,
      [TerrainType.DESERT]: 0,
      [TerrainType.TUNDRA]: 0,
    };

    for (const tile of result.mapData.tiles) {
      terrainCounts[tile.terrain]++;
    }

    console.log('[Test 2] Terrain distribution:', terrainCounts);
    
    // Validate we have ice caps (should be on top/bottom rows)
    if (terrainCounts[TerrainType.ICECAP] === 0) {
      throw new Error('No ice cap tiles found');
    }
    
    // Validate we have oceans (should be on specific rows)
    if (terrainCounts[TerrainType.OCEAN] === 0) {
      throw new Error('No ocean tiles found');
    }
    
    // Validate we have grassland (should fill remaining areas)
    if (terrainCounts[TerrainType.GRASSLAND] === 0) {
      throw new Error('No grassland tiles found');
    }

    // Test 3: Validate elevation ranges
    console.log('[Test 3] Validating elevation ranges...');
    const elevations = result.mapData.tiles.map(t => t.elevation);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    
    console.log(`[Test 3] Elevation range: ${minElevation} to ${maxElevation}`);
    
    if (minElevation < 0 || maxElevation > 4) {
      throw new Error(`Invalid elevation range: ${minElevation}-${maxElevation}, expected 0-4`);
    }

    // Test 4: Validate coordinates are correct
    console.log('[Test 4] Validating tile coordinates...');
    const coordSet = new Set<string>();
    for (const tile of result.mapData.tiles) {
      const coordKey = `${tile.coordinates.q},${tile.coordinates.r}`;
      if (coordSet.has(coordKey)) {
        throw new Error(`Duplicate coordinate found: ${coordKey}`);
      }
      coordSet.add(coordKey);
      
      if (tile.coordinates.q < 0 || tile.coordinates.q >= 50 ||
          tile.coordinates.r < 0 || tile.coordinates.r >= 30) {
        throw new Error(`Invalid coordinates: ${tile.coordinates.q},${tile.coordinates.r}`);
      }
    }

    // Test 5: Test different map sizes
    console.log('[Test 5] Testing different map sizes...');
    const smallGenerator = new MapGenerator(10, 10);
    const smallResult = smallGenerator.generateWithDetails();
    
    if (smallResult.mapData.tiles.length !== 100) {
      throw new Error(`Small map should have 100 tiles, got ${smallResult.mapData.tiles.length}`);
    }

    console.log('[MapGeneration Test] All tests passed! ✅');
    console.log(`[Summary] Generated ${result.totalTilesGenerated} tiles across ${result.passResults.length} passes`);
    
    // Log pass results for debugging
    for (const passResult of result.passResults) {
      console.log(`[Pass] ${passResult.message}`);
    }

  } catch (error) {
    console.error('[MapGeneration Test] Test failed! ❌');
    console.error('[Error]', error);
    throw error;
  }
}

// For standalone testing
if (require.main === module) {
  testMapGeneration();
} 