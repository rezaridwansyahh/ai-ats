import express from 'express';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';
import OfferPackController from './offer-pack.controller.js';

const router = express.Router();

router.get('/portal/:token', OfferPackController.getViewLinkBasic);
router.post('/portal/:token/verify-email', OfferPackController.verifyViewLinkEmail);
router.get( '/portal/:token/summary', OfferPackController.requireApprovalViewAuth.bind(OfferPackController), OfferPackController.getSummary);

router.get( '/job/:job_id', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferPackController.getByJob);
router.get('/:offer_id',authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferPackController.getStatus);

router.post( '/:offer_id/decide', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.decide);

router.post( '/:offer_id/view-link', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.generateViewLink);

export default router;