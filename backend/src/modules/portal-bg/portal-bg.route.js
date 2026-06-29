import express from 'express';
const router = express.Router();

import portalBgConsentController from './portal-bg.controller.js';

// Public — no auth, candidate opens link directly
router.get( '/:token', portalBgConsentController.getByToken);
router.post('/:token/sign', portalBgConsentController.sign);

export default router;