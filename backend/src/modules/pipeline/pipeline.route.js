import express from 'express';
const router = express.Router();
import pipelineController from './pipeline.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/:jobId', pipelineController.getByJobId);
router.put('/:jobId', pipelineController.saveStages);

export default router;
