import express from 'express';
const router = express.Router();

import portalQaController from './portal-qa.controller.js';

// Public — candidate opens the emailed /qa/:token link.
router.get('/:token', portalQaController.getByToken);
router.post('/:token/verify-email', portalQaController.verifyEmail);

// Email-gated (scope 'qa' JWT from verify-email).
router.get(
  '/:token/questions',
  portalQaController.requireQaAuth.bind(portalQaController),
  portalQaController.getQuestions
);

router.post(
  '/:token/submit',
  portalQaController.requireQaAuth.bind(portalQaController),
  portalQaController.submit
);

export default router;
