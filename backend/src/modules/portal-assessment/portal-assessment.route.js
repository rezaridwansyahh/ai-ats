import express from 'express';
const router = express.Router();

import portalAssessmentController from './portal-assessment.controller.js';

router.get('/:hash', portalAssessmentController.getByHash);
router.post('/:hash/verify-email', portalAssessmentController.verifyEmail);

router.get(
  '/:hash/form',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.getForm
);

router.put(
  '/:hash/participant',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.updateParticipant
);

router.post(
  '/:hash/start',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.startAttempt
);

router.get(
  '/:hash/questions',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.getQuestions
);

router.get(
  '/:hash/progress',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.getProgress
);

router.post(
  '/:hash/answer',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.saveAnswer
);

router.post(
  '/:hash/score',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.saveSubtestScore
);

router.post(
  '/:hash/submit',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.submit
);

export default router;
