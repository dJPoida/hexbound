import express from 'express';

import {
  createGame,
  getGameByCode,
  getGamesForUser,
  joinGame,
} from '../controllers/game.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Route to get all games for the authenticated user
router.get('/', authMiddleware, getGamesForUser);

// Route to get a specific game by its human-readable code
router.get('/by-code/:gameCode', authMiddleware, getGameByCode);

// Route for a user to join a game
router.post('/:gameCode/join', authMiddleware, joinGame);

// Route to create a new game, protected by the auth middleware
router.post('/', authMiddleware, createGame);

export default router; 