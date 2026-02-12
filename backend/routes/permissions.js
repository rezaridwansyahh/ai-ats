import express from 'express';
const router = express.Router();

import PermissionController from '../controllers/PermissionController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken);

router.get('/role/:role_id', PermissionController.getByRoleIdDetail);
router.get('/:id', PermissionController.getByIdDetails);

export default router;