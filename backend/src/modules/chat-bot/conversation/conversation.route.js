import express from 'express';
const router = express.Router();

import ConversationController from './conversation.controller.js';
import requireCandidatePortalAuth from '../../../shared/middleware/auth-onboarding.middleware.js';

router.get('/me', requireCandidatePortalAuth, ConversationController.getMe);

export default router;