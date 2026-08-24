import express from 'express';
const router = express.Router();

import assessmentController from './assessment.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

// ─── Specific routes MUST come before generic param routes ───────────────────
router.get('/workboard', assessmentController.getWorkboard);
router.get('/job/:job_id', assessmentController.getByJobId);

export default router;
