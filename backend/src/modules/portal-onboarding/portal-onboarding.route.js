import express from 'express';
const router = express.Router();

import PortalOnboardingController from './portal-onboarding.controller.js';
import requireCandidatePortalAuth from '../../shared/middleware/auth-onboarding.middleware.js';

router.post('/login', PortalOnboardingController.login);

router.get('/me', requireCandidatePortalAuth, PortalOnboardingController.getMe);
router.get('/curriculum', requireCandidatePortalAuth, PortalOnboardingController.getCurriculum);
router.get('/journey', requireCandidatePortalAuth, PortalOnboardingController.getJourney);
router.get('/module/:module_id', requireCandidatePortalAuth, PortalOnboardingController.getModuleDetail);

export default router;