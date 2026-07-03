import express from 'express';
const router = express.Router();
import portalBgConsentController from './portal-bg.controller.js';

router.get('/:token', portalBgConsentController.getByToken);

router.post('/:token/verify-email', portalBgConsentController.verifyEmail);

router.get( '/:token/consent', portalBgConsentController.requireBgConsentAuth.bind(portalBgConsentController), portalBgConsentController.getConsent);

router.post( '/:token/sign', portalBgConsentController.requireBgConsentAuth.bind(portalBgConsentController), portalBgConsentController.sign);

export default router;