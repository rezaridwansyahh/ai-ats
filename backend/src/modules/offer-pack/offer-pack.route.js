import express from 'express';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';
import OfferPackController from './offer-pack.controller.js';

const router = express.Router();

router.get('/portal/:token', OfferPackController.getByToken);
router.put('/portal/:token/decide', OfferPackController.decideByToken);

router.get( '/job/:job_id', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferPackController.getByJob);

router.post( '/:offer_id', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.create);

router.get( '/:offer_id',authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferPackController.getByOfferId);

router.put( '/:offer_id/decide', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.decide);
router.post( '/:offer_id/revoke', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.revoke);
router.post( '/:offer_id/resend', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.resend);

export default router;