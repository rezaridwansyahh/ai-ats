import express from 'express';
const router = express.Router();
import settingController from './setting.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/:key', settingController.get);
router.put('/:key', settingController.save);

export default router;
