// Game list item type for lobby display

import { Game } from "../../../server/entities/Game.entity";

export type GameListItem = Pick<Game, 'gameId' | 'gameCode' | 'status' | 'players'> & {
  playerCount: number;
  isMyTurn: boolean;
  currentPlayerId: string;
}; 