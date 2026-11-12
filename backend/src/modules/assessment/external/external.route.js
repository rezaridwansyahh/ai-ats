import express from 'express';
const router = express.Router();

import externalAssessmentController from './external.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/by-candidate', externalAssessmentController.getByCandidateJob);
router.post('/preview', externalAssessmentController.previewInvitation);
router.post('/send', externalAssessmentController.sendInvitation);
router.post('/:id/decision', externalAssessmentController.recordDecision);

export default router;
