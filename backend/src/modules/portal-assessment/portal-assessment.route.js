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

router.post(
  '/:hash/submit',
  portalAssessmentController.requirePortalAuth.bind(portalAssessmentController),
  portalAssessmentController.submit
);

export default router;
