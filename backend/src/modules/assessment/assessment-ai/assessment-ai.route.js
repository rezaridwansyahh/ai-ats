import express from 'express';
import controller from './assessment-ai.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.use(authToken);

router.post('/generate-section',   controller.generateSection.bind(controller));
router.post('/generate-synthesis', controller.generateSynthesis.bind(controller));

export default router;
