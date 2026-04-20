import express from 'express';
const router = express.Router();

import assessmentBatteryResultController from './assessment-battery-result.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

// public (participant)
router.post('/token/:token/submit', assessmentBatteryResultController.submitByToken);
router.get('/token/:token', assessmentBatteryResultController.getByToken);

router.use(authToken);

// protected (recruiter)
router.get('/', assessmentBatteryResultController.getAll);
router.get('/session/:session_id', assessmentBatteryResultController.getBySessionId);
router.get('/:id', assessmentBatteryResultController.getById);

router.post('/session/:session_id/report', assessmentBatteryResultController.generateReport);

router.put('/session/:session_id/report', assessmentBatteryResultController.saveReport);
router.put('/session/:session_id/review', assessmentBatteryResultController.updateRecruiterReview);
router.put('/:id', assessmentBatteryResultController.update);

router.delete('/:id', assessmentBatteryResultController.delete);

export default router;
