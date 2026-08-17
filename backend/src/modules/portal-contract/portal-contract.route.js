import express from 'express';
const router = express.Router();
import PortalContractController from './portal-contract.controller.js';
import { createOfferSendUpload } from '../../shared/middleware/offer-send.middleware.js';

const contractSendUpload = createOfferSendUpload('contract');

router.get('/:token', PortalContractController.getByToken);
router.post('/:token/verify-email', PortalContractController.verifyEmail);

const auth = PortalContractController.requireContractAuth.bind(PortalContractController);

router.get('/:token/contract', auth, PortalContractController.getContract);
router.get('/:token/document/download', auth, PortalContractController.downloadDocument);

router.post('/:token/upload', auth, contractSendUpload.single('file'), PortalContractController.upload);
router.post('/:token/submit', auth, PortalContractController.submit);

export default router;