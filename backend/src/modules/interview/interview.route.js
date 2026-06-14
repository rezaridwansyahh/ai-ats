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

router.get( '/:interview_id/schedules', interviewController.getSchedules);
router.post('/:interview_id/schedules', interviewController.createSchedule);
router.put( '/schedules/:schedule_id', interviewController.updateSchedule);
router.post('/schedules/:schedule_id/confirm', interviewController.confirmSchedule);
router.post('/schedules/:schedule_id/unconfirm', interviewController.unconfirmSchedule);
router.delete('/schedules/:schedule_id', interviewController.deleteSchedule);

router.get('/job/:job_id/prep', interviewController.getPrep);

router.post('/job/:job_id/prep/questions/generate', interviewController.generateQuestions);
router.put( '/job/:job_id/prep/questions', interviewController.updateQuestions);
router.put( '/job/:job_id/prep/rubric', interviewController.updateRubric);
router.post('/job/:job_id/prep/rubric/lock', interviewController.lockRubric);
router.post('/job/:job_id/prep/rubric/unlock', interviewController.unlockRubric);

router.post('/schedules/:schedule_id/outcome', interviewController.recordOutcome);
router.delete('/schedules/:schedule_id/outcome', interviewController.clearOutcome);

export default router;