// This file defines the structure of game-related objects
// shared between the client and server.

// --- Core Game/Player Objects ---

export interface Player {
  userId: string;
  userName: string;
}

export const GameStatusValues = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export type GameStatusName =
  (typeof GameStatusValues)[keyof typeof GameStatusValues];

export interface GameStatus {
  statusId: number;
  statusName: GameStatusName;
}

export type GameListItem = {
  gameId: string;
  gameCode: string;
  status: GameStatus;
  createdByUser: boolean;
};

// --- Map & Tile Objects ---

export type AxialCoordinates = {
  q: number; // Column
  r: number; // Row
};

export enum TerrainType {
  GRASSLAND = 'GRASSLAND',
  DESERT = 'DESERT',
  TUNDRA = 'TUNDRA',
  OCEAN = 'OCEAN',
  ICECAP = 'ICECAP',
}

export interface TileData {
  coordinates: AxialCoordinates;
  elevation: number;
  terrain: TerrainType;
}

export interface MapData {
  gameId: string;
  width: number;
  height: number;
  tiles: TileData[];
}

// --- Client Game State ---

export type GameState = {
  gameId: string;
  gameCode: string;
  players: Player[];
  status: GameStatus;
  map: MapData;
  // Note: This will be expanded with more state properties like currentTurn,
  // currentPlayerId, etc. as we build out features.
}; 