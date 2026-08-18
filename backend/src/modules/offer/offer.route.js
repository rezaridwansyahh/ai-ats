import express from 'express';
import OfferController from './offer.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';
import upload, { createOfferUpload } from '../../shared/middleware/offer.middleware.js';

const router = express.Router();
const contractUpload = createOfferUpload('contract');
const contractExecutedUpload = createOfferUpload('contract_executed');

// L1 Workboard - get all offers across jobs for company
router.get(
  '/workboard',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'read'),
  OfferController.getWorkboard
);

// L2 Position - get offers for specific job
router.get(
  '/job/:job_id',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'read'),
  OfferController.getOffersByJob
);

// L3 Candidate - get single offer detail
router.get(
  '/:offer_id',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'read'),
  OfferController.getOfferById
);

// Create new offer (from BG Check calibration)
router.post(
  '/create',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'create'),
  OfferController.createOffer
);

// Update offer compensation
router.put(
  '/:offer_id/compensation',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.updateCompensation
);

router.post(
  '/:offer_id/send',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.sendOffer
);

// Candidate accepts offer (public endpoint - portal)
router.post(
  '/:offer_id/accept',
  OfferController.acceptOffer
);

// Candidate rejects offer (public endpoint - portal)
router.post(
  '/:offer_id/reject',
  OfferController.rejectOffer
);

// Candidate negotiates (public endpoint - portal)
router.post(
  '/:offer_id/negotiate',
  OfferController.negotiateOffer
);

// Recruiter responds to negotiation
router.post(
  '/:offer_id/negotiate/respond',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.respondToNegotiation
);

// L4 Calibration - bulk advance to Onboarding
router.post(
  '/calibrate/:job_id/advance',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.bulkAdvanceToOnboarding
);

// Get offer statistics
router.get(
  '/stats/:job_id',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'read'),
  OfferController.getOfferStats
);

router.get(
  '/:offer_id/slip-gaji',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'read'),
  OfferController.getSlipGaji
);

router.post(
  '/:offer_id/slip-gaji/record',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.recordSlipGaji
);

router.post(
  '/:offer_id/slip-gaji/skip',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.skipSlipGaji
);

router.post(
  '/:offer_id/slip-gaji/review',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.reviewSlipGaji
);

router.get('/:offer_id/approval', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getApproval);
router.post('/:offer_id/approval/decide', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.submitApproval);
router.post('/:offer_id/approval/chain', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.setupApprovalChain);
router.post('/:offer_id/approval/chain/:step_index/decide', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.decideApprovalStep);

router.get('/:offer_id/send-history', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getSendHistory);

router.post('/:offer_id/revoke', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.revokeOffer);

router.get('/:offer_id/offer-letter/fields', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getOfferLetterFields);

router.put('/:offer_id/offer-letter/data', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.saveOfferLetterData);

router.get('/:offer_id/offer-letter/final', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getOfferLetterFinal);
router.get('/:offer_id/offer-letter/download/docx', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.downloadOfferLetterDocx);
router.get('/:offer_id/offer-letter/download/pdf', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.downloadOfferLetterPdf);

router.post('/:offer_id/offer-letter/preview', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.generateOfferLetterPreview);
router.put('/:offer_id/offer-letter/final', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.saveOfferLetterFinal);

router.get('/:offer_id/document', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getOfferDocument);

router.post('/:offer_id/document/upload', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), upload.single('file'), OfferController.uploadDocument);

router.get( '/:offer_id/candidate-file/download', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.downloadCandidateFile);

router.get('/:offer_id/contract/document', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getContractDocument);

router.post('/:offer_id/contract/document/upload', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), contractUpload.single('file'), OfferController.uploadContractDocument);
router.post('/:offer_id/contract/document/send', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.sendContractDocument);
router.post('/:offer_id/contract/document/revoke', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.revokeContractDocument);

router.get('/:offer_id/contract/send-history', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getContractSendHistory);
router.get('/:offer_id/contract/candidate-file/download', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.downloadContractCandidateFile);

router.post('/:offer_id/contract/executed/upload', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), contractExecutedUpload.single('file'), OfferController.uploadContractExecutedDocument);

router.get('/:offer_id/contract/executed', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getContractExecutedDocument);
router.get('/:offer_id/contract/executed/download', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.downloadContractExecutedDocument);

export default router;