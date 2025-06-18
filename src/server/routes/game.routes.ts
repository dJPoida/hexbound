import express from 'express';
import { createGame, getGamesForUser } from '../controllers/game.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Route to get all games for the authenticated user
router.get('/', authMiddleware, getGamesForUser);

// Route to create a new game, protected by the auth middleware
router.post('/', authMiddleware, createGame);

export default router; 