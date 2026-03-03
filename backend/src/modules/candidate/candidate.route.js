import express from 'express';
const router = express.Router();

import candidateController from './candidate.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', candidateController.getAll);
router.get('/job-posting/:job_posting_id', candidateController.getByJobPostingId);
router.get('/:id', candidateController.getById);

router.put('/:id/status', candidateController.updateStatus);

router.delete('/:id', candidateController.delete);

export default router;
