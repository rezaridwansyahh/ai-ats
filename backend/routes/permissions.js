import express from 'express';
const router = express.Router();

import PermissionController from '../controllers/PermissionController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken);

router.get('/',               PermissionController.getAll);
router.get('/details',        PermissionController.getAllWithDetails);
router.get('/role/:role_id',  PermissionController.getByRoleIdDetail);
router.get('/:id',            PermissionController.getByIdDetails);

router.post('/', PermissionController.create);

router.put('/:id', PermissionController.update);

router.delete('/:id', PermissionController.delete);

export default router;