import express from 'express';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';
import OfferPackController from './offer-pack.controller.js';

const router = express.Router();

router.get('/portal/:token', OfferPackController.getChainByToken);
router.put('/portal/:token/step/:step_id/decide', OfferPackController.decideStepByToken);
router.get('/portal/:token/letter/docx', OfferPackController.downloadLetterDocxByToken);
router.get('/portal/:token/letter/pdf', OfferPackController.downloadLetterPdfByToken);

router.get( '/job/:job_id', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferPackController.getByJob);

router.post( '/:offer_id/setup', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.setupChain);
router.put( '/:offer_id/revise', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.reviseChain);

router.get( '/:offer_id', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferPackController.getChain);

router.post('/:offer_id/finalize',authToken,checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),OfferPackController.finalizeChain);
router.put('/:offer_id/step/:step_id/decide', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferPackController.decideStep);

export default router;