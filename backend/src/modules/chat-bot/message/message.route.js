import express from 'express';
const router = express.Router();

import MessageController from './message.controller.js';
import requireCandidatePortalAuth from '../../../shared/middleware/auth-onboarding.middleware.js';

router.get('/conversation/:conversation_id', requireCandidatePortalAuth, MessageController.list);
router.post('/conversation/:conversation_id', requireCandidatePortalAuth, MessageController.create);

export default router;