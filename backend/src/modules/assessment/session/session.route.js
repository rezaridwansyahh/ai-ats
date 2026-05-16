import express from 'express';
const router = express.Router();

import sessionController from './session.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

// public (participant)
router.get('/token/:token', sessionController.getByToken);
router.post('/token/:token/complete', sessionController.markCompletedByToken);

router.use(authToken);

// protected (recruiter)
router.get('/', sessionController.getAll);
router.get('/from-candidate', sessionController.getActiveByCandidateJob);
router.get('/participant/:participant_id', sessionController.getByParticipantId);
router.get('/job/:job_id', sessionController.getByJobId);
router.get('/:id', sessionController.getById);

router.post('/', sessionController.create);
router.post('/from-candidate', sessionController.findOrCreateFromCandidate);
router.post('/:id/complete', sessionController.markCompleted);

router.put('/:id', sessionController.update);

router.delete('/:id', sessionController.delete);

export default router;
