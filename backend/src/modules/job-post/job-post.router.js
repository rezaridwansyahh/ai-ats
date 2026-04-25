import express from 'express';
const router = express.Router();

import jobPostController from './job-post.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

router.use(authToken);

router.get('/',             checkPermission('Settings', 'Account', 'read'),   jobPostController.getAll);
router.get('/:id',          checkPermission('Settings', 'Account', 'read'),   jobPostController.getById);
router.get('/job/:job_id',  checkPermission('Settings', 'Account', 'read'),   jobPostController.getByJobId);
router.post('/',            checkPermission('Settings', 'Account', 'create'), jobPostController.create);
router.post('/publish',     checkPermission('Settings', 'Account', 'create'), jobPostController.publish);
router.put('/:id',          checkPermission('Settings', 'Account', 'update'), jobPostController.update);
router.delete('/:id',       checkPermission('Settings', 'Account', 'delete'), jobPostController.delete);

export default router;
