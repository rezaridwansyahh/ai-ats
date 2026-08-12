import express from 'express';
const router = express.Router();
import PortalOfferController from './portal-offer.controller.js';
import offerSendUpload from '../../shared/middleware/offer-send.middleware.js';

router.get('/:token', PortalOfferController.getByToken);
router.post('/:token/verify-email', PortalOfferController.verifyEmail);

const auth = PortalOfferController.requireOfferAuth.bind(PortalOfferController);

router.get('/:token/offer', auth, PortalOfferController.getOffer);
router.get('/:token/document/download', auth, PortalOfferController.downloadDocument);


router.post('/:token/upload', auth, offerSendUpload.single('file'), PortalOfferController.upload);
router.post('/:token/submit', auth, PortalOfferController.submit);

export default router;