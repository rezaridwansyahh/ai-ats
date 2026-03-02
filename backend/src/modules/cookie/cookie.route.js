import { Router } from 'express';
import cookieController from './cookie.controller.js';

const router = Router();

router.post('/check-cookies', cookieController.checkCookie);

router.post('/create', cookieController.create);

export default router;
