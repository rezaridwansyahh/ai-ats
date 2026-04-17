import express from 'express';
const router = express.Router();

import candidatePipelineController from './candidate-pipeline.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', candidatePipelineController.getAll);
router.get('/job/:job_id', candidatePipelineController.getByJobId);
router.get('/:id/stages', candidatePipelineController.getStages);
router.get('/:id', candidatePipelineController.getById);

router.post('/', candidatePipelineController.create);
router.post('/:id/stages', candidatePipelineController.addStage);

router.put('/:id', candidatePipelineController.update);

router.delete('/:id', candidatePipelineController.delete);

export default router;
