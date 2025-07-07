import { Router } from 'express';

import {
  loginOrRegisterUser,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public route: POST /api/user/login
router.post('/login', loginOrRegisterUser);

// Protected route: POST /api/user/subscribe-push
router.post('/subscribe-push', authMiddleware, subscribeToPushNotifications);

// Protected route: POST /api/user/unsubscribe-push
router.post('/unsubscribe-push', authMiddleware, unsubscribeFromPushNotifications);

export default router; 