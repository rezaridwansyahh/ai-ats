import express from 'express';
const router = express.Router();

import jobPostingController from './job-post.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', jobPostingController.getAll);
router.get('/user/:user_id', jobPostingController.getByUserId);
router.get('/user/:user_id/status', jobPostingController.getByUserIdAndStatus);
router.get('/user/:user_id/full', jobPostingController.getSeekByUserId);
router.get('/:id', jobPostingController.getById);
router.get('/:id/full', jobPostingController.getFullById);

router.post('/seek', jobPostingController.submitSeek);

router.put('/:id', jobPostingController.update);
router.put('/:id/status', jobPostingController.updateStatus);

router.delete('/:id', jobPostingController.delete);

export default router;