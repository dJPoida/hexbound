import { Router } from 'express';
import { loginOrRegisterUser, subscribeToPushNotifications } from '../controllers/user.controller';
import { API_ROUTES } from '../../shared/constants/api.const';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.post(API_ROUTES.LOGIN, loginOrRegisterUser);

// Protected routes (require a valid session token)
router.post(API_ROUTES.SUBSCRIBE_PUSH, authMiddleware, subscribeToPushNotifications);

export default router; 