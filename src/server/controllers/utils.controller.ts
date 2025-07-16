import { Response } from 'express';

import { AppDataSource } from '../data-source';
import { Game } from '../entities/Game.entity';
import redisClient from '../redisClient';
import { AuthenticatedRequest } from '../types/middleware';

export const resetGameData = async (req: AuthenticatedRequest, res: Response) => {
  // Optional: Add an admin check here in the future
  // if (!req.user?.isAdmin) {
  //   return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
  // }

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Clear Postgres Data
    // We need to delete in the correct order to respect foreign key constraints.
    // The 'game_players' table is a join table created by TypeORM.
    await queryRunner.query('TRUNCATE TABLE "game_players" RESTART IDENTITY CASCADE');
    await queryRunner.query('TRUNCATE TABLE "games" RESTART IDENTITY CASCADE');
    
    // Note: We are not clearing the 'user' or 'game_status' tables.

    await queryRunner.commitTransaction();
    
    // Clear Redis Data
    const stream = redisClient.scanIterator({
      MATCH: 'game:*',
      COUNT: 100,
    });
    
    let keysDeleted = 0;
    for await (const key of stream) {
      await redisClient.del(key);
      keysDeleted++;
    }

    res.status(200).json({ 
      message: `Successfully deleted all game data. Postgres tables truncated and ${keysDeleted} Redis keys removed.` 
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('[API /utils/reset-game-data] Error resetting game data:', error);
    res.status(500).json({ message: 'Failed to reset game data.', error: (error as Error).message });
  } finally {
    await queryRunner.release();
  }
}; 