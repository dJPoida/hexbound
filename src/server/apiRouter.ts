import express from 'express';
import userRoutes from './routes/user.routes';
import miscRoutes from './routes/misc.routes';

const router = express.Router();

// Middleware to parse JSON bodies, will be applied to all routes in this router
router.use(express.json());

router.use(userRoutes);
router.use(miscRoutes);

export default router; 