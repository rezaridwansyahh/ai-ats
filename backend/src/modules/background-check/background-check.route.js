import express from 'express';
const router = express.Router();

import backgroundCheckController from './background-check.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/workboard', backgroundCheckController.getWorkboard);
router.get('/by-candidate/:candidate_id', backgroundCheckController.getByCandidateId);
router.get('/job/:job_id', backgroundCheckController.getByJob);

router.post('/:bg_id/verdict', backgroundCheckController.saveVerdict);

router.patch('/:bg_id/status', backgroundCheckController.updateStatus);
router.patch('/:bg_id/archive', backgroundCheckController.archive);

router.get('/:bg_id', backgroundCheckController.getById);

export default router;