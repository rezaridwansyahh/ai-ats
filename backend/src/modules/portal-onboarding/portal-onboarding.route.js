import express from 'express';
const router = express.Router();

import PortalOnboardingController from './portal-onboarding.controller.js';
import requireCandidatePortalAuth from '../../shared/middleware/auth-onboarding.middleware.js';

router.post('/login', PortalOnboardingController.login);

router.get('/me', requireCandidatePortalAuth, PortalOnboardingController.getMe);
router.get('/curriculum', requireCandidatePortalAuth, PortalOnboardingController.getCurriculum);

export default router;