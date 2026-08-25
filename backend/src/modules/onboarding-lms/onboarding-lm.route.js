import express from 'express';
import OnboardingLmsController from './onboarding-lm.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get( '/phases', OnboardingLmsController.getPhases); 

router.post( '/phases', OnboardingLmsController.createPhase);

router.put( '/phases/:phase_id', OnboardingLmsController.updatePhase);

router.get( '/phases/:phase_id/modules', authToken , OnboardingLmsController.getModulesByPhase);

router.post( '/phases/:phase_id/modules', authToken, OnboardingLmsController.createModule);

router.put( '/modules/:module_id', authToken, OnboardingLmsController.updateModule);

router.get( '/modules/:module_id/content', authToken , OnboardingLmsController.getContent);

router.post( '/modules/:module_id/content', authToken, OnboardingLmsController.createContent);

router.put( '/content/:content_id', authToken, OnboardingLmsController.updateContent);

router.get( '/hire/:candidate_onboarding_id/curriculum', authToken , OnboardingLmsController.getHireCurriculum);

router.patch( '/hire/:candidate_onboarding_id/module/:module_id/progress', authToken, OnboardingLmsController.updateHireProgress);

export default router;