import express from 'express';
const router = express.Router();

import companyUsageController from './company-usage.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import roleMiddleware from '../../shared/middleware/role.middleware.js';
import attachRoleFlags, { requireSuperAdmin } from '../../shared/middleware/role-superadmin.middleware.js';

router.use(authToken);
router.use(attachRoleFlags);

router.get('/platform-summary', requireSuperAdmin, companyUsageController.getPlatformSummary);
router.get('/', companyUsageController.list);
router.get('/summary', companyUsageController.summary);
router.get('/budget', companyUsageController.getBudget);
router.put('/budget', roleMiddleware('Settings', 'Budget', 'update'), companyUsageController.updateBudget);

export default router;
