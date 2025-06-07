import express from 'express';
import { createGame } from '../controllers/game.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Route to create a new game, protected by the auth middleware
router.post('/games', authMiddleware, createGame);

export default router; 