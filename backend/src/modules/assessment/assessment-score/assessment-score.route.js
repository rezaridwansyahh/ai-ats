import express from 'express';
const router = express.Router();

import assessmentScoreController from './assessment-score.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.post('/', assessmentScoreController.upsert);
router.get('/result/:result_id', assessmentScoreController.getByResultId);

export default router;
