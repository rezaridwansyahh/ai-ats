import express from 'express';
const router = express.Router();

import controller from './attendance-setting.controller.js';

router.get('/', controller.getAll);
router.put('/', controller.update);

export default router;