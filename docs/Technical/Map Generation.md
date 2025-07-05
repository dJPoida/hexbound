---
title: Map Generation
description: Technical documentation of the map generation pipeline
---

# Map Generation

We need to document the map generation engine. It's a pipeline and it implements each stage in the pipeline additively. 

## Pipeline Stages

The map generation follows a specific order:

1. **Grid Initialization**: Setting up the hex grid structure
2. **Ice Caps**: Applying polar ice cap regions
3. **Oceans**: Placing water bodies and coastlines
4. **Grassland Fill**: Filling remaining areas with grassland terrain

## Implementation Details

The pipeline is implemented in the `MapGenerator` class (`src/server/helpers/mapGenerator.ts`). Each stage is executed as a separate method that modifies the map state additively.

> **Note**: This documentation is a work in progress. More technical details will be added as the implementation evolves.