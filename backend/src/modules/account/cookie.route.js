import { Router } from 'express';
import cookieController from './cookie.controller.js';

const router = Router();

router.post('/save', cookieController.create);

export default router;