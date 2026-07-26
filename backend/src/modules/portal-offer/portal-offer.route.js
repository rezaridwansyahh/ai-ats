import express from 'express';
const router = express.Router();
import PortalOfferController from './portal-offer.controller.js';

router.get('/:token', PortalOfferController.getByToken);
router.get( '/:token/offer', PortalOfferController.requireOfferAuth.bind(PortalOfferController), PortalOfferController.getOffer);

router.post('/:token/verify-email', PortalOfferController.verifyEmail);
router.post( '/:token/sign', PortalOfferController.requireOfferAuth.bind(PortalOfferController), PortalOfferController.sign);

export default router;