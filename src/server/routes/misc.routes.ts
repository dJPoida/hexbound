import { Router } from 'express';

import { getPing, getVersion, testRedis } from '../controllers/misc.controller';

const router = Router();

router.get('/version', getVersion);
router.get('/ping', getPing);
router.get('/redis-test', testRedis);

export default router;
