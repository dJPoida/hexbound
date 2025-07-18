---
title: Tile Adjacency
description:
  Technical documentation of hex tile adjacency patterns and implementation
---

# Tile Adjacency

## Overview

Hex tile adjacency in our map system follows a **six-way connectivity pattern**
for flat-top hexagons arranged in a row-based grid with alternating row offsets.

## Visual Orientation

- **Hex tiles are oriented** with flat sections on top and bottom
- **Rows are horizontally offset** from each other to create the honeycomb
  pattern
- **Even rows (0, 2, 4...)** and **odd rows (1, 3, 5...)** have different
  neighbor patterns

## Adjacency/Neighbor Patterns

### **Odd Columns (q = 1, 3, 5, 7...)** with **Even Rows (r = 0, 2, 4, 6...)**

For a tile at position `(q, r)` in an even row with an even column, the six
adjacent tiles are:

```
                (q, r - 1)
(q - 1, r)                  (q + 1, r)
                (q, r    )
(q - 1, r + 1)              (q + 1, r + 1)
                (q, r + 1)
```

**Adjacent coordinates:**

In clockwise order:

1. **Top**: `(q, r-1)` - directly above
2. **Top-Right**: `(q+1, r)` - above and to the right
3. **Bottom-Right**: `(q+1, r+1)` - below and to the right
4. **Bottom**: `(q, r+1)` - directly below
5. **Bottom-Left**: `(q-1, r+1)` - below and to the left
6. **Top-Left**: `(q-1, r)` - above and to the left

### **Even Columns (q = 0, 2, 4, 6...)** with **Even Rows (r = 0, 2, 4, 6...)**

For a tile at position `(q, r)` in an even row with an even column, the six
adjacent tiles are:

```
                (q, r - 1)
(q - 1, r - 1)              (q + 1, r - 1)
                (q, r    )
(q - 1, r)                  (q + 1, r)
                (q, r + 1)
```

**Adjacent coordinates:**

1. **Top**: `(q, r-1)` - directly above
2. **Top-Right**: `(q+1, r-1)` - above and to the right
3. **Bottom-Right**: `(q+1, r)` - below and to the right
4. **Bottom**: `(q, r+1)` - directly below
5. **Bottom-Left**: `(q-1, r)` - below and to the left
6. **Top-Left**: `(q-1, r-1)` - above and to the left

### **Odd Columns (q = 1, 3, 5, 7...)** with **Odd Rows (r = 1, 3, 5, 7...)**

For a tile at position `(q, r)` in an odd row, the six adjacent tiles are:

```
                (q, r - 1)
(q - 1, r)                  (q + 1, r)
                (q, r    )
(q - 1, r + 1)              (q + 1, r + 1)
                (q, r + 1)
```

**Adjacent coordinates:**

1. **Top**: `(q, r-1)` - directly above
2. **Top-Right**: `(q+1, r)` - above and to the right
3. **Bottom-Right**: `(q+1, r+1)` - below and to the right
4. **Bottom**: `(q, r+1)` - directly below
5. **Bottom-Left**: `(q-1, r+1)` - below and to the left
6. **Top-Left**: `(q-1, r)` - above and to the left

### **Even Columns (q = 0, 2, 4, 6...)** with **Odd Rows (r = 1, 3, 5, 7...)**

For a tile at position `(q, r)` in an odd row, the six adjacent tiles are:

```
                (q, r - 1)
(q - 1, r - 1)              (q + 1, r - 1)
                (q, r    )
(q - 1, r)                  (q + 1, r)
                (q, r + 1)
```

**Adjacent coordinates:**

1. **Top**: `(q, r-1)` - directly above
2. **Top-Right**: `(q+1, r-1)` - above and to the right
3. **Bottom-Right**: `(q+1, r)` - below and to the right
4. **Bottom**: `(q, r+1)` - directly below
5. **Bottom-Left**: `(q-1, r)` - below and to the left
6. **Top-Left**: `(q-1, r-1)` - above and to the left

### **Key Differences from Axial Coordinates**

- **Not using axial coordinate system** (which would use different offset
  patterns)
- **Row-based grid** with alternating offsets
- **Flat-top hex orientation** (not pointy-top)
- **Visual alignment** matches the rendered hex grid

## Usage Examples

### **Example 1: Tile (5, 2) - Odd Column, Even Row**

Adjacent tiles:

- `(5, 1)` - top
- `(6, 2)` - top-right
- `(6, 3)` - bottom-right
- `(5, 3)` - bottom
- `(4, 3)` - bottom-left
- `(4, 2)` - top-left

### **Example 2: Tile (5, 3) - Odd Column, Odd Row**

Adjacent tiles:

- `(5, 2)` - top
- `(6, 3)` - top-right
- `(6, 4)` - bottom-right
- `(5, 4)` - bottom
- `(4, 4)` - bottom-left
- `(4, 3)` - top-left

## Boundary Handling

- **Out-of-bounds tiles** return `null` in the adjacency array
- **Cyclic X-axis**: Tiles wrap around horizontally (west to east in the q axis)
- **Finite Y-axis**: No wrapping vertically (north to south boundaries in the r
  axis)

## Applications

This adjacency system is used for:

- **Terrain generation** (influencing adjacent tile types)
- **Elevation calculations** (smooth transitions between adjacent tiles)
- **Pathfinding algorithms** (movement between connected tiles)

## Rules and Constraints

- **Six-way adjacency**: All hex tile adjacency calculations must check all six
  edges
- **Visual orientation**: Hex tiles are oriented with flat sections on top and
  bottom **THERE IS NO LEFT AND RIGHT ADJACENCY**
- **Row-based movement**: Adjacency includes tiles directly above, below and
  diagonal neighbors
- **Implementation consistency**: Always use the six neighbor offsets defined in
  `MapGenerationContext.getNeighbors()` method

This definition ensures consistent six-way connectivity across the entire hex
grid while respecting the visual layout and alternating row structure of our map
system.
