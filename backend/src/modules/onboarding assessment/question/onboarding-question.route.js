import express from 'express';
const router = express.Router();

import onboardingQuestionController from './onboarding-question.controller.js';
import requireCandidatePortalAuth from '../../../shared/middleware/auth-onboarding.middleware.js';

router.use(requireCandidatePortalAuth);

router.get('/', onboardingQuestionController.getAllAssessments);
router.get('/assessment/:code', onboardingQuestionController.getByAssessmentCode);
router.get('/:id', onboardingQuestionController.getById);

export default router;