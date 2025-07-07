import { Router } from 'express';

import * as utilsController from '../controllers/utils.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/utils/reset-game-data
// This is a dangerous endpoint, so it's protected by the standard auth middleware.
// In a real production scenario, you'd want to add an additional check
// to ensure the user has an 'admin' role.
router.post('/reset-game-data', authMiddleware, utilsController.resetGameData);

export default router; 