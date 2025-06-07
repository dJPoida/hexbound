import { Router } from 'express';
import { loginOrRegisterUser } from '../controllers/user.controller';

const router = Router();

router.post('/login', loginOrRegisterUser);

export default router; 