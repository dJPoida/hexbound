import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Game } from '../entities/Game.entity';
import { User } from '../entities/User.entity';
import { generateGameCode } from '../helpers/gameCode.helper';
import redisClient from '../redisClient';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { GameStatus, GameStatusValues } from '../entities/GameStatus.entity';
import { ServerGameState, SocketMessage } from '../../shared/types/socket.types';
import { RedisJSON } from '@redis/json/dist/commands';
import { broadcastToGame } from '../socketSubscriptionManager';
import { SOCKET_MESSAGE_TYPES } from '../../shared/constants/socket.const';

export const getGameByCode = async (req: Request, res: Response) => {
  const { gameCode } = req.params;

  if (!gameCode) {
    return res.status(400).json({ message: 'Game code is required.' });
  }

  const gameRepository = AppDataSource.getRepository(Game);

  try {
    const game = await gameRepository
      .createQueryBuilder("game")
      .leftJoinAndSelect("game.status", "status")
      .leftJoinAndSelect("game.players", "player")
      .where("game.gameCode = :gameCode", { gameCode })
      .getOne();

    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error(`[API /games/by-code/${gameCode} GET] Error fetching game:`, error);
    res.status(500).json({ message: 'Error fetching game', error: (error as Error).message });
  }
};

export const getGamesForUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = res.locals.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication error: User ID not found.' });
  }

  const gameRepository = AppDataSource.getRepository(Game);

  try {
    // Find all games where the current user is a player, directly in the database.
    const userGames = await gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.status', 'status')
      .leftJoinAndSelect('game.players', 'player')
      .where(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select('g.gameId')
            .from(Game, 'g')
            .innerJoin('g.players', 'p')
            .where('p.userId = :userId')
            .getQuery();
          return 'game.gameId IN ' + subQuery;
        },
      )
      .setParameter('userId', userId)
      .orderBy('game.gameId', 'DESC')
      .getMany();

    // For each game, fetch the current player ID from Redis
    const gamesWithCurrentPlayer = await Promise.all(
      userGames.map(async (game) => {
        const gameState = await redisClient.json.get(`game:${game.gameId}`) as ServerGameState | null;
        return {
          ...game,
          currentPlayerId: gameState?.currentPlayerId || null,
        };
      })
    );

    // We may want to simplify the returned payload later
    res.status(200).json(gamesWithCurrentPlayer);

  } catch (error) {
    console.error('[API /games GET] Error fetching games:', error);
    res.status(500).json({ message: 'Error fetching games', error: (error as Error).message });
  }
};

export const joinGame = async (req: AuthenticatedRequest, res: Response) => {
  const { gameCode } = req.params;
  const userId = res.locals.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication error: User ID not found.' });
  }

  const gameRepository = AppDataSource.getRepository(Game);
  const userRepository = AppDataSource.getRepository(User);

  try {
    const game = await gameRepository.findOne({ where: { gameCode }, relations: ['players', 'status'] });
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    const user = await userRepository.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user is already in the game
    if (game.players.some(player => player.userId === userId)) {
      // User is already a player, so this is a successful "join"
      return res.status(200).json({ message: 'Already joined.', gameId: game.gameId });
    }

    // Add the user to the game's players
    game.players.push(user);
    await gameRepository.save(game);

    // Now, update the game state in Redis
    const redisKey = `game:${game.gameId}`;
    const currentState = await redisClient.json.get(redisKey) as ServerGameState | null;

    if (currentState) {
      const newPlayer = {
        userId: user.userId,
        userName: user.userName,
      };
      currentState.players.push(newPlayer);
      await redisClient.json.set(redisKey, '$', currentState as unknown as RedisJSON);
      
      // Finally, broadcast the updated state to all clients in the game
      const broadcastMessage: SocketMessage<ServerGameState> = {
        type: SOCKET_MESSAGE_TYPES.GAME_STATE_UPDATE,
        payload: currentState,
      };
      broadcastToGame(game.gameId, JSON.stringify(broadcastMessage));
    }

    res.status(200).json({ message: 'Successfully joined game.', gameId: game.gameId });
  } catch (error) {
    console.error(`[API /games/${gameCode}/join] Error joining game:`, error);
    res.status(500).json({ message: 'Error joining game', error: (error as Error).message });
  }
};

export const createGame = async (req: AuthenticatedRequest, res: Response) => {
  // The user's ID is now available from the auth middleware
  const userId = res.locals.userId;
  if (!userId) {
    // This case should ideally not be reached if authMiddleware is working correctly
    return res.status(401).json({ message: 'Authentication error: User ID not found.' });
  }

  const gameRepository = AppDataSource.getRepository(Game);
  const userRepository = AppDataSource.getRepository(User);
  const statusRepository = AppDataSource.getRepository(GameStatus);

  try {
    // 1. Find the user who is creating the game
    const user = await userRepository.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the 'waiting' status from the database
    const waitingStatus = await statusRepository.findOne({ where: { statusName: GameStatusValues.WAITING } });
    if (!waitingStatus) {
        return res.status(500).json({ message: "Initial game status 'waiting' not found in database." });
    }

    // 2. Generate a unique game code
    let gameCode;
    let isCodeUnique = false;
    let attempts = 0;
    do {
      gameCode = generateGameCode();
      const existingGame = await gameRepository.findOne({ where: { gameCode } });
      if (!existingGame) {
        isCodeUnique = true;
      }
      attempts++;
    } while (!isCodeUnique && attempts < 10);

    if (!isCodeUnique) {
      return res.status(500).json({ message: 'Failed to generate a unique game code after several attempts.' });
    }
    
    // 3. Create and save the new game
    const game = gameRepository.create({
      gameCode,
      status: waitingStatus,
      players: [user], // Add the creator as the first player
    });
    await gameRepository.save(game);

    // 4. Initialize game state in Redis
    const initialGameState: ServerGameState = {
      gameId: game.gameId,
      gameCode: game.gameCode,
      turnNumber: 1,
      currentPlayerId: user.userId, // The creator starts the first turn
      players: [
        {
          userId: user.userId,
          userName: user.userName,
        },
      ],
      turnActionLog: [], // To store actions taken in a turn
      mapData: {}, // To be determined later
      gameState: {
        placeholderCounter: 0
      }
    };

    // Use JSON.SET to store the object
    await redisClient.json.set(`game:${game.gameId}`, '$', initialGameState as unknown as RedisJSON);

    // 5. Send the successful response
    res.status(201).json({
      message: 'Game created successfully',
      gameId: game.gameId,
      gameCode: game.gameCode,
    });

  } catch (error) {
    console.error('[API /games] Error creating game:', error);
    res.status(500).json({ message: 'Error creating game', error: (error as Error).message });
  }
}; 