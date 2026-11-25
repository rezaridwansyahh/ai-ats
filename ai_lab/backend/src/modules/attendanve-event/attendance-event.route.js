import express from 'express';
const router = express.Router();

import controller from './attendance-event.controller.js';

router.post('/events', controller.receive);
router.get('/clock/:nik', controller.getClock);

export default router;