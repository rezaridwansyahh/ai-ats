import express from 'express';
const router = express.Router();

import roleController from './role.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken); 

router.get('/', roleController.getAll);
router.get('/permission/:permission_id', roleController.getByPermissionId);
router.get('/user/:user_id', roleController.getByUserId);
router.get('/:id', roleController.getById);

router.post('/', roleController.create);

router.delete('/:id', roleController.delete); 

router.put('/:id', roleController.update);
router.put('/:id/permission', roleController.setPermissions);

export default router;