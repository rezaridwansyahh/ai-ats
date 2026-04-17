import express from 'express';
const router = express.Router();

import jobPostController from './job-post.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

router.use(authToken);

router.get('/',             checkPermission('Job Postings', 'Account', 'read'),   jobPostController.getAll);
router.get('/:id',          checkPermission('Job Postings', 'Account', 'read'),   jobPostController.getById);
router.get('/job/:job_id',  checkPermission('Job Postings', 'Account', 'read'),   jobPostController.getByJobId);
router.post('/',            checkPermission('Job Postings', 'Account', 'create'), jobPostController.create);
router.post('/publish',     checkPermission('Job Postings', 'Account', 'create'), jobPostController.publish);
router.put('/:id',          checkPermission('Job Postings', 'Account', 'update'), jobPostController.update);
router.delete('/:id',       checkPermission('Job Postings', 'Account', 'delete'), jobPostController.delete);

export default router;
