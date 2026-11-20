import express from 'express';
const router = express.Router();

import roleController from './role.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import roleSuperAdmin, { requireSuperAdmin } from '../../shared/middleware/role-superadmin.middleware.js';

router.use(authToken);
router.use(roleSuperAdmin);

// Platform-admin cross-tenant audit — registered before the generic routes
// below purely for readability; no ordering conflict since this path has two
// segments and can't be shadowed by the single-segment /:id routes.
router.get('/admin/all-companies', requireSuperAdmin, roleController.getAllAcrossCompanies);

router.get('/', roleController.getAll);
router.get('/permission/:permission_id', roleController.getByPermissionId);
router.get('/user/:user_id', roleController.getByUserId);
router.get('/:id', roleController.getById);

router.post('/', roleController.create);

router.delete('/:id', roleController.delete); 

router.put('/:id', roleController.update);
router.put('/:id/permission', roleController.setPermissions);

export default router;