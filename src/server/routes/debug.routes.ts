import { Router } from 'express';

import { regenerateMap } from '../controllers/debug.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/debug/regenerate-map
// Debug endpoint for regenerating the map during development
router.post('/regenerate-map', authMiddleware, regenerateMap);

export default router;
