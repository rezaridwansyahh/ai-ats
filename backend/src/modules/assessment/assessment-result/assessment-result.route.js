import express from 'express';
const router = express.Router();

import assessmentResultController from './assessment-result.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', assessmentResultController.getAll);
router.get('/participant/:participant_id', assessmentResultController.getByParticipantId);
router.get('/:id', assessmentResultController.getById);

router.post('/', assessmentResultController.create);

router.put('/:id', assessmentResultController.update);

router.delete('/:id', assessmentResultController.delete);

export default router;
