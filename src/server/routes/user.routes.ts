import { Router } from 'express';
import { loginOrRegisterUser } from '../controllers/user.controller';
import { API_ROUTES } from '../../shared/constants/api.const';

const router = Router();

router.post(API_ROUTES.LOGIN, loginOrRegisterUser);

export default router; 