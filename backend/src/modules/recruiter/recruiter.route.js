import express from 'express';
const router = express.Router();

import recruiterController from './recruiter.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

router.use(authToken);

router.get('/', checkPermission('Settings', 'Recruiters', 'read'), recruiterController.getAll);
router.get('/:id', checkPermission('Settings', 'Recruiters', 'read'), recruiterController.getById);
router.post('/', checkPermission('Settings', 'Recruiters', 'create'), recruiterController.create);
router.put('/:id', checkPermission('Settings', 'Recruiters', 'update'), recruiterController.update);
router.delete('/:id', checkPermission('Settings', 'Recruiters', 'delete'), recruiterController.delete);

export default router;
