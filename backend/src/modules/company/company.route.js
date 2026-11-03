import express from 'express';
const router = express.Router();

import companyController from './company.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import attachRoleFlags, { requireSuperAdmin } from '../../shared/middleware/role-superadmin.middleware.js';

router.use(authToken);
router.use(attachRoleFlags);

router.get('/me', companyController.getCompanyDetail);
router.post('/', requireSuperAdmin, companyController.create);
router.put('/me', companyController.update);
router.delete('/:id', requireSuperAdmin, companyController.delete);

export default router;