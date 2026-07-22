import express from 'express';
import OfferController from './offer.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

const router = express.Router();

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

// Generate & send offer letter
router.post(
  '/:offer_id/send',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.sendOfferLetter
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

// Generate contract (after offer accepted)
router.post(
  '/:offer_id/contract/generate',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.generateContract
);

// Send contract for signature
router.post(
  '/:offer_id/contract/send',
  authToken,
  checkPermission('Offer & Onboard', 'Offer & Contract', 'update'),
  OfferController.sendContract
);

// Candidate signs contract (public endpoint - portal)
router.post(
  '/:offer_id/contract/sign',
  OfferController.signContract
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

router.post( '/:offer_id/approval', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.submitApproval);
router.post( '/:offer_id/approval/setup', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.setupApprovalChain);
router.post( '/:offer_id/approval/:step_index/decide', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.decideApprovalStep);

router.get( '/:offer_id/send-history', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), OfferController.getSendHistory);
 
router.post( '/:offer_id/resend', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.resendOffer);
router.post( '/:offer_id/revoke', authToken, checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), OfferController.revokeOffer);

export default router;
