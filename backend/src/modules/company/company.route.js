import express from 'express';
const router = express.Router();

import companyController from './company.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import attachRoleFlags, { requireSuperAdmin } from '../../shared/middleware/role-superadmin.middleware.js';

router.use(authToken);
router.use(attachRoleFlags);

router.get('/', requireSuperAdmin, companyController.getAll);
router.get('/:id', companyController.getById);
router.post('/', requireSuperAdmin, companyController.create);
router.put('/:id', requireSuperAdmin, companyController.update);
router.delete('/:id', requireSuperAdmin, companyController.delete);

export default router;