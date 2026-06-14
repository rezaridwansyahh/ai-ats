import express from 'express';
const router = express.Router();

import interviewController from './interview.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

// ─── Specific routes MUST come before generic param routes ───────────────────
router.get('/workboard', interviewController.getWorkboard);
router.get('/by-candidate/:candidate_id', interviewController.getInterviewByCandidateId);

// Schedule-related routes (must be before /:interview_id)
router.get( '/:interview_id/schedules', interviewController.getSchedules);
router.post('/:interview_id/schedules', interviewController.createSchedule);
router.put( '/schedules/:schedule_id', interviewController.updateSchedule);
router.post('/schedules/:schedule_id/confirm', interviewController.confirmSchedule);
router.post('/schedules/:schedule_id/unconfirm', interviewController.unconfirmSchedule);
router.delete('/schedules/:schedule_id', interviewController.deleteSchedule);
router.post('/schedules/:schedule_id/outcome', interviewController.recordOutcome);
router.delete('/schedules/:schedule_id/outcome', interviewController.clearOutcome);

// Job/Prep routes (must be before /:interview_id)
router.get('/job/:job_id', interviewController.getInterviewsByJob);
router.get('/job/:job_id/prep', interviewController.getPrep);
router.post('/job/:job_id/prep/questions/generate', interviewController.generateQuestions);
router.put( '/job/:job_id/prep/questions', interviewController.updateQuestions);
router.put( '/job/:job_id/prep/rubric', interviewController.updateRubric);
router.post('/job/:job_id/prep/rubric/lock', interviewController.lockRubric);
router.post('/job/:job_id/prep/rubric/unlock', interviewController.unlockRubric);

// Generic interview routes (LAST to avoid catching specific routes)
router.get('/:interview_id', interviewController.getInterview);
router.patch('/:interview_id/status', interviewController.updateStatus);

export default router;