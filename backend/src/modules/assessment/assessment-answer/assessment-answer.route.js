import express from 'express';
const router = express.Router();

import assessmentAnswerController from './assessment-answer.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.post('/', assessmentAnswerController.upsert);
router.get('/result/:result_id', assessmentAnswerController.getByResultId);

export default router;
