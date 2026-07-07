import express from 'express';
const router = express.Router();

import backgroundCheckController from './background-check.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/workboard', backgroundCheckController.getWorkboard);
router.get('/by-candidate/:candidate_id', backgroundCheckController.getByCandidateId);
router.get('/job/:job_id', backgroundCheckController.getByJob);

router.put( '/claims/:claim_id', backgroundCheckController.updateClaim);
router.patch( '/claims/:claim_id/selected', backgroundCheckController.toggleClaim);
router.delete('/claims/:claim_id', backgroundCheckController.deleteClaim);

router.put('/lanes/:lane_id', backgroundCheckController.updateTracker);
router.post('/:bg_id/claims/extract', backgroundCheckController.extractClaims);
router.post('/:bg_id/claims/confirm', backgroundCheckController.confirmClaims);
router.post('/:bg_id/claims', backgroundCheckController.addClaim);
router.get( '/:bg_id/claims', backgroundCheckController.getClaims);

router.post('/:bg_id/consent/generate-link', backgroundCheckController.generateConsentLink);
router.post('/:bg_id/consent/revoke', backgroundCheckController.revokeConsent);
router.get( '/:bg_id/consent', backgroundCheckController.getConsent);

router.get( '/:bg_id/lanes/counts', backgroundCheckController.getLaneCounts);
router.post('/:bg_id/lanes/create', backgroundCheckController.createFromClaims);
router.get( '/:bg_id/lanes', backgroundCheckController.getLanes);

router.post( '/:bg_id/verdict', backgroundCheckController.saveVerdict);
router.patch('/:bg_id/status', backgroundCheckController.updateStatus);
router.patch('/:bg_id/archive', backgroundCheckController.archive);

router.get('/:bg_id', backgroundCheckController.getById);

console.log('BG routes registered:');
router.stack.forEach((r) => {
  if (r.route) {
    console.log(r.route.stack[0].method.toUpperCase(), r.route.path);
  }
});

export default router;