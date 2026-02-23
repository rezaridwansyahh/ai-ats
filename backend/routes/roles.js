import express from 'express';
const router = express.Router();

import RoleController from '../controllers/RoleController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken); 

router.get('/', RoleController.getAll);
router.get('/permission/:permission_id', RoleController.getByPermissionId);
router.get('/user/:user_id', RoleController.getByUserId);
router.get('/:id', RoleController.getById);

router.post('/', RoleController.create);

router.delete('/:id', RoleController.delete); 

router.put('/:id',             RoleController.update);
router.put('/:id/permissions', RoleController.setPermissions);

export default router;