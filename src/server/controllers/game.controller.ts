import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Game } from '../entities/Game.entity';
import { User } from '../entities/User.entity';
import { generateGameCode } from '../helpers/gameCode.helper';
import redisClient from '../redisClient';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { GameStatus } from '../entities/GameStatus.entity';
import { GameStatusValues } from '../entities/GameStatus.entity';

export const getGamesForUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication error: User ID not found.' });
  }

  const gameRepository = AppDataSource.getRepository(Game);

  try {
    // Find all games where the current user is a player, directly in the database.
    const userGames = await gameRepository
      .createQueryBuilder("game")
      .leftJoinAndSelect("game.status", "status")
      .leftJoinAndSelect("game.players", "player")
      .where("player.userId = :userId", { userId })
      .orderBy("game.gameId", "DESC")
      .getMany();

    // We may want to simplify the returned payload later
    res.status(200).json(userGames);

  } catch (error) {
    console.error('[API /games GET] Error fetching games:', error);
    res.status(500).json({ message: 'Error fetching games', error: (error as Error).message });
  }
};

export const createGame = async (req: AuthenticatedRequest, res: Response) => {
  // The user's ID is now available from the auth middleware
  const userId = req.user?.userId;
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
    const initialGameState = {
      gameId: game.gameId,
      gameCode: game.gameCode,
      turn: 1,
      players: [
        {
          userId: user.userId,
          userName: user.userName,
        },
      ],
      mapData: {}, // To be determined later
      gameState: {
        placeholderCounter: 0
      }
    };

    // Use JSON.SET to store the object
    await redisClient.json.set(`game:${game.gameId}`, '$', initialGameState);

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