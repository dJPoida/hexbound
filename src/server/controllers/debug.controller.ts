import { RedisJSON } from '@redis/json/dist/commands';
import { Response } from 'express';

import { SOCKET_MESSAGE_TYPES } from '../../shared/constants/socket.const';
import { MapUpdatePayload,ServerGameState, SocketMessage } from '../../shared/types/socket';
import config from '../config';
import { AppDataSource } from '../data-source';
import { Game } from '../entities/Game.entity';
import { calculateMapChecksum } from '../helpers/calculateMapChecksum.helper';
import { toClientState } from '../helpers/clientState.helper';
import { MapGenerator } from '../helpers/mapGenerator';
import redisClient from '../redisClient';
import { broadcastToGame } from '../socketSubscriptionManager';
import { AuthenticatedRequest } from '../types/middleware';

export const regenerateMap = async (req: AuthenticatedRequest, res: Response) => {
  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ message: 'Game ID is required.' });
  }

  try {
    // Get the game from the database
    const gameRepository = AppDataSource.getRepository(Game);
    const game = await gameRepository
      .createQueryBuilder("game")
      .leftJoinAndSelect("game.status", "status")
      .leftJoinAndSelect("game.players", "player")
      .where("game.gameId = :gameId", { gameId })
      .getOne();

    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    // Get the current game state from Redis
    const gameStateKey = `game:${gameId}`;
    const gameState = await redisClient.json.get(gameStateKey) as ServerGameState;

    if (!gameState) {
      return res.status(404).json({ message: 'Game state not found.' });
    }

    // Check if it's turn 1
    if (gameState.turnNumber !== 1) {
      return res.status(400).json({ message: 'Map regeneration is only allowed on turn 1.' });
    }

    // Generate a new map with a random seed for variation
    const randomSeed = Math.random().toString(36).substring(2, 15);
    console.log(`[DEBUG] Regenerating map for game ${gameId} with seed: ${randomSeed}`);
    
    // Use OCEAN_WORLD preset for more dramatic changes
    const mapGenerator = new MapGenerator(config.map.defaultWidth, config.map.defaultHeight, 'OCEAN_WORLD', randomSeed, game.players.length);
    const newMapData = mapGenerator.generate();
    
    console.log(`[DEBUG] New map generated: ${newMapData.width}x${newMapData.height}, ${newMapData.tiles.length} tiles`);
    
    // Log some statistics about the new map
    const terrainCounts = newMapData.tiles.reduce((acc, tile) => {
      acc[tile.terrain] = (acc[tile.terrain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`[DEBUG] New map terrain distribution:`, terrainCounts);

    // Update the game state with the new map
    const updatedGameState: ServerGameState = {
      ...gameState,
      mapData: newMapData
    };

    // Save the updated game state to Redis
    await redisClient.json.set(gameStateKey, '.', updatedGameState as RedisJSON);

    // Send updated game state (without map data) to all clients
    const clientState = toClientState(updatedGameState);
    const gameStateMessage: SocketMessage<typeof clientState> = {
      type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
      payload: clientState
    };
    broadcastToGame(gameId, JSON.stringify(gameStateMessage));

    // Send map update separately
    const checksum = calculateMapChecksum(newMapData);
    const mapUpdateMessage: SocketMessage<MapUpdatePayload> = {
      type: SOCKET_MESSAGE_TYPES.GAME_MAP_UPDATE,
      payload: {
        gameId,
        mapData: newMapData,
        checksum,
      },
    };
    broadcastToGame(gameId, JSON.stringify(mapUpdateMessage));
    console.log(`[DEBUG] Sent map update to game ${gameId} with checksum ${checksum}`);

    console.log(`[DEBUG] Map regenerated for game ${gameId}`);
    res.json({ message: 'Map regenerated successfully.' });
  } catch (error) {
    console.error('[DEBUG] Error regenerating map:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}; 