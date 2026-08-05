import express from 'express';
import PortalInterviewController from './portal-interview.controller.js';

const router = express.Router();

// No auth middleware — public portal routes
router.get('/:token', PortalInterviewController.getByToken);
router.put('/:token/outcome/:packCandidateId', PortalInterviewController.saveOutcome);
router.post('/:token/submit', PortalInterviewController.submit);

export default router;
