import express from 'express';
const router = express.Router();

import controller from './attendance.controller.js';

router.get('/home', controller.home);
router.get('/dashboard', controller.dashboard);
router.get('/recap', controller.recap);

export default router;