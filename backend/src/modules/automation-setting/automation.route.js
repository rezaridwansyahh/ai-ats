import express from 'express';
const router = express.Router();

import automationController from './automation.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', automationController.getAll);
router.get('/:jobId', automationController.getByJobId);
router.post('/', automationController.create);
router.put('/:jobId', automationController.update);

export default router;
