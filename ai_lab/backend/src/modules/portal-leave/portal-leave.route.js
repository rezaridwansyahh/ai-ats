import express from 'express';
const router = express.Router();

import portalLeaveController from './portal-leave.controller.js';

router.get('/:token', portalLeaveController.getByToken);
router.post('/:token/decide', portalLeaveController.decide);

export default router;