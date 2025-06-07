import express from 'express';
import { createGame } from '../controllers/game.controller';

const router = express.Router();

// Route to create a new game
router.post('/games', createGame);

export default router; 