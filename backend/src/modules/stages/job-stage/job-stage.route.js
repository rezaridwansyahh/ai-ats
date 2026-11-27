import express from 'express';
const router = express.Router();
import jobStageController from './job-stage.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/:jobId', jobStageController.getByJobId);
router.put('/:jobId', jobStageController.saveStages);

export default router;
