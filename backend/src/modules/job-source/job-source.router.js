import express from 'express';
const router = express.Router();

import jobSourcingController from './job-source.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', jobSourcingController.getAll);
router.get('/user/:user_id', jobSourcingController.getByUserId);
router.get('/user/:user_id/status', jobSourcingController.getByUserIdAndStatus);
router.get('/user/:user_id/full', jobSourcingController.getSeekByUserId);

router.get('/jobPost/:job_post_id', jobSourcingController.getByJobPostId);

router.get('/:id', jobSourcingController.getById);
router.get('/:id/full', jobSourcingController.getFullById);

router.post('/seek', jobSourcingController.submitSeek);

router.put('/:id', jobSourcingController.update);
router.put('/:id/status', jobSourcingController.updateStatus);

router.delete('/:id', jobSourcingController.delete);

export default router;