import express from 'express';
const router = express.Router();

import assessmentBatteryResultController from './assessment-battery-result.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', assessmentBatteryResultController.getAll);
router.get('/participant/:participant_id/active', assessmentBatteryResultController.getActiveProgress);
router.get('/participant/:participant_id', assessmentBatteryResultController.getByParticipantId);
router.get('/:id', assessmentBatteryResultController.getById);

router.post('/', assessmentBatteryResultController.submit);

router.put('/:id/report', assessmentBatteryResultController.updateReport);

router.delete('/:id', assessmentBatteryResultController.delete);

export default router;
