---
title: Map Generation
description: Technical documentation of the map generation pipeline
---

# Map Generation

We need to document the map generation engine. It's a pipeline and it implements
each stage in the pipeline additively.

## Pipeline Stages

The map generation follows a specific order:

1. **Grid Initialization**: Setting up the hex grid structure
2. **Ice Caps**: Applying polar ice cap regions
3. **Oceans**: Placing water bodies and coastlines
4. **Grassland Fill**: Filling remaining areas with grassland terrain

## Implementation Details

The pipeline is implemented in the `MapGenerator` class
(`src/server/helpers/mapGenerator.ts`). Each stage is executed as a separate
method that modifies the map state additively.

## Ice Cap Generation

The IceCapPass generates natural ice cap formations at the top and bottom of the
map, creating a barrier system with organic ice flows that extend into the
playable area.

### Generation Strategy

#### **Top Ice Formation (Rows 0-4)**

- **Rows 0-1**: 100% ice coverage with elevation 4 (solid barrier)
- **Row 2**: 60% chance of ice formation if adjacent to existing ice
- **Row 3**: 25% chance of ice formation if adjacent to existing ice
- **Row 4**: 3.5% chance of ice formation if adjacent to existing ice
- **Row 5+**: No ice generation

#### **Bottom Ice Formation (Rows height-5 to height-1)**

- **Rows height-2 to height-1**: 100% ice coverage with elevation 4 (solid
  barrier)
- **Row height-3**: 60% chance of ice formation if adjacent to existing ice
- **Row height-4**: 25% chance of ice formation if adjacent to existing ice
- **Row height-5**: 3.5% chance of ice formation if adjacent to existing ice
- **Row height-6+**: No ice generation

### Key Rules

#### **Connectivity Rule**

- Ice tiles must always be adjacent to existing ice tiles (six-way hex
  adjacency)
- No isolated ice formations allowed
- Uses proper hex grid adjacency for flat-top hexes with alternating row offsets

#### **Elevation System**

- **Barrier rows (0-1, height-2 to height-1)**: Always elevation 4
- **Extension rows**: Elevation based on adjacent ice tiles above, but never
  higher than adjacent tiles above
- **Minimum elevation**: 2 (no ice tiles below elevation 2)
- **Maximum elevation**: 4 (no ice tiles above elevation 4)
- **Natural slope**: Small variation (0 to -1) creates realistic ice formations

#### **Adjacency Calculation**

- **Even rows**: neighbors are (q±1,r), (q,r±1), (q-1,r-1), (q+1,r-1)
- **Odd rows**: neighbors are (q±1,r), (q,r±1), (q-1,r+1), (q+1,r+1)
- Ensures proper hex grid connectivity for flat-top hex orientation

### Visual Effect

- Creates a solid 2-row ice barrier at map edges
- Natural ice formations extend up to 3 additional rows deep
- Elevation gradients create realistic "ice wall" effect
- Ice appears to flow downward from high barrier edges
- Maintains minimum elevation 2 for playability near ocean areas

### Implementation Details

- Uses probabilistic generation with decreasing chances by depth
- Independent generation for top and bottom (same logic, inverted coordinates)
- Respects existing tiles set by previous passes
- Maintains smooth elevation transitions between adjacent tiles
- Hard-coded parameters for consistent barrier behavior

> **Note**: This documentation is a work in progress. More technical details
> will be added as the implementation evolves.
