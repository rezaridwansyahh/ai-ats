import express from 'express';
const router = express.Router();

import companyController from './company.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import attachRoleFlags, { requireSuperAdmin } from '../../shared/middleware/role-superadmin.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

router.use(authToken);
router.use(attachRoleFlags);

router.get('/', requireSuperAdmin, companyController.getAll);
router.get('/me', companyController.getCompanyDetail);
router.post('/', requireSuperAdmin, companyController.create);
router.put('/me', checkPermission('Settings', 'Company', 'update'), companyController.update);

// Param routes registered after the literal /me routes above, so "/me"
// never gets swallowed as an :id.
router.get('/:id', requireSuperAdmin, companyController.getById);
router.get('/:id/users', requireSuperAdmin, companyController.getUsers);
router.put('/:id', requireSuperAdmin, companyController.updateById);
router.delete('/:id', requireSuperAdmin, companyController.delete);

export default router;