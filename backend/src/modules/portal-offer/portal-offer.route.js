import express from 'express';
const router = express.Router();
import PortalOfferController from './portal-offer.controller.js';

router.get( '/:offer_id/send-history', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), PortalOfferController.getSendHistory);

router.post('/:offer_id/resend', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), PortalOfferController.resendOffer);
 

export default router;