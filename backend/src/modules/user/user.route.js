import express from 'express';
const router = express.Router();

import userController from './user.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

router.use(authToken);

router.get('/role/all', userController.getMasterRoles);
router.get('/', userController.getAllWithRoles);
router.get('/:id', userController.getByIdWithRoles);

router.post('/', userController.create);

router.put('/:id', userController.update);

router.delete('/:id', userController.delete);

export default router;