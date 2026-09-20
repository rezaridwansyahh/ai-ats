import express from 'express';
const router = express.Router();

import onboardingLmsController from './onboarding-lms.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import lmsUpload from '../../shared/middleware/onboarding-lms.middleware.js';

router.use(authToken);

router.get('/phases', onboardingLmsController.getPhases);
router.post('/phases', onboardingLmsController.createPhase);
router.put('/phases/reorder', onboardingLmsController.reorderPhases);
router.put('/phases/:phase_id', onboardingLmsController.updatePhase);

router.get('/phases/:phase_id/modules', onboardingLmsController.getModulesByPhase);
router.post('/phases/:phase_id/modules', onboardingLmsController.createModule);
router.get('/modules/:module_id', onboardingLmsController.getModuleById);
router.put('/modules/:module_id', onboardingLmsController.updateModule);

router.get('/modules/:module_id/content', onboardingLmsController.getContent);
router.post('/modules/:module_id/content', onboardingLmsController.createContent);
router.post('/modules/:module_id/content/upload', lmsUpload.single('file'), onboardingLmsController.uploadContent);
router.put('/content/:content_id', onboardingLmsController.updateContent);
router.get('/content/:content_id/file', onboardingLmsController.downloadContent);

router.get('/hire/:candidate_onboarding_id/curriculum', onboardingLmsController.getHireCurriculum);
router.patch('/hire/:candidate_onboarding_id/module/:module_id/progress', onboardingLmsController.updateHireProgress);

export default router;