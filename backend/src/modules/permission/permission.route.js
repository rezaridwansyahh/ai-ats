import express from 'express';
const router = express.Router();

import permissionController from './permission.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', permissionController.getAll);
router.get('/details', permissionController.getAllWithDetails);
router.get('/role/:role_id', permissionController.getByRoleIdDetail);
router.get('/:id', permissionController.getByIdDetails);

router.post('/', permissionController.create);

router.put('/:id', permissionController.update);

router.delete('/:id', permissionController.delete);

export default router;