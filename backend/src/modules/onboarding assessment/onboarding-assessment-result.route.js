import express from 'express';
const router = express.Router();

import OnboardingAssessmentResultController from './onboarding-assessment-result.controller.js';
import requireCandidatePortalAuth from '../../shared/middleware/auth-onboarding.middleware.js';

router.use(requireCandidatePortalAuth);

router.get('/results', OnboardingAssessmentResultController.getMyResults);
router.get('/results/:battery', OnboardingAssessmentResultController.getByCode);
router.post('/submit', OnboardingAssessmentResultController.submit);

export default router;