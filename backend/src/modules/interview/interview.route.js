import express from 'express';
const router = express.Router();

import interviewController from './interview.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/workboard', interviewController.getWorkboard);
router.get('/job/:job_id', interviewController.getInterviewsByJob);
router.get('/by-candidate/:candidate_id', interviewController.getInterviewByCandidateId);
router.get('/:interview_id', interviewController.getInterview);
router.patch('/:interview_id/status', interviewController.updateStatus);
router.patch('/:interview_id/schedule', interviewController.scheduleInterview);
router.get('/job/:job_id/prep', interviewController.getPrep);

router.post('/job/:job_id/prep/questions/generate', interviewController.generateQuestions);
router.put('/job/:job_id/prep/questions', interviewController.updateQuestions);
router.put('/job/:job_id/prep/rubric', interviewController.updateRubric);
router.post('/job/:job_id/prep/rubric/lock', interviewController.lockRubric);
router.post('/job/:job_id/prep/rubric/unlock', interviewController.unlockRubric);

export default router;