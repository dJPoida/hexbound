import { Router } from 'express';
import express from 'express'; // Required for the .json() middleware

import gameRoutes from './routes/game.routes';
import miscRoutes from './routes/misc.routes';
import userRoutes from './routes/user.routes';
import utilsRoutes from './routes/utils.routes';

const router = Router();

// Middleware to parse JSON bodies, will be applied to all routes in this router
router.use(express.json());

// More specific routes should be registered first.
// These sub-routers now correctly handle their own paths.
router.use('/games', gameRoutes);
router.use('/user', userRoutes);
router.use('/utils', utilsRoutes);

// General routes that are not nested under a specific resource
router.use('/', miscRoutes); // Handles GET /api/version, etc.

export default router; 