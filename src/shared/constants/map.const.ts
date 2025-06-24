/**
 * The width of the hex tile's visual content, in pixels.
 */
export const HEX_WIDTH = 120;
/**
 * The height of the hex tile's visual content, in pixels.
 */
export const HEX_HEIGHT = 80;
/**
 * The horizontal offset for the main hex sprite within its container, accounting for margins.
 */
export const HEX_OFFSET_X = -5;
/**
 * The vertical offset for the main hex sprite within its container, accounting for margins.
 */
export const HEX_OFFSET_Y = -5;
/**
 * The horizontal position for the elevation text, relative to the tile container's origin.
 */
export const HEX_TEXT_OFFSET_X = 60;
/**
 * The vertical position for the elevation text, relative to the tile container's origin.
 */
export const HEX_TEXT_OFFSET_Y = 80;
/**
 * The horizontal position for the west wall sprite, relative to the tile container's origin.
 */
export const HEX_FRONT_WALL_X_OFFSET = 25;
/**
 * The vertical position for the front wall sprite, relative to the tile container's origin.
 */
export const HEX_FRONT_WALL_Y_OFFSET = 115;
/**
 * The horizontal position for the west wall sprite, relative to the tile container's origin.
 */
export const HEX_WEST_WALL_X_OFFSET = -5;
/**
 * The vertical position for the west wall sprite, relative to the tile container's origin.
 */
export const HEX_WEST_WALL_Y_OFFSET = 75;
/**
 * The horizontal position for the east wall sprite, relative to the tile container's origin.
 */
export const HEX_EAST_WALL_X_OFFSET = 125;
/**
 * The vertical position for the east wall sprite, relative to the tile container's origin.
 */
export const HEX_EAST_WALL_Y_OFFSET = 75;
/**
 * The minimum width a tile should ever have on screen, in pixels. Used to calculate max zoom-out.
 */
export const MIN_TILE_WIDTH_ON_SCREEN = 60; // pixels
/**
 * The maximum percentage of the screen width a single tile can occupy. Used to calculate max zoom-in.
 */
export const MAX_TILE_WIDTH_PERCENTAGE = 0.8; // 80% of screen width
/**
 * The transparent margin around each tile asset, in pixels.
 */
export const TILE_PIXEL_MARGIN = 5;
/**
 * The vertical distance, in pixels, for each level of elevation.
 */
export const ELEVATION_STEP = 10;
/**
 * The font family to use for the tile's elevation text.
 */
export const TILE_FONT="Arial";
/**
 * The font size to use for the tile's elevation text.
 */
export const TILE_FONT_SIZE = 20;