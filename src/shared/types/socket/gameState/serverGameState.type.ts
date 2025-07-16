// Server-side game state structure

import { Player } from '../../core/player.type';
import { MapData } from '../../map/mapData.type';
import { TurnAction } from './turnAction.type';

// The full, internal game state stored in Redis
export interface ServerGameState {
  [key: string]: unknown; // To allow for use as a RedisJSON object
  gameId: string;
  gameCode: string;
  turnNumber: number;
  currentPlayerId: string;
  players: Player[];
  turnActionLog: TurnAction[];
  mapData: MapData;
  gameState: {
    placeholderCounter: number;
  };
} 