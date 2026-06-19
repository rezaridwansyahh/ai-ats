import express from 'express';
const router = express.Router();

import companyUsageController from './company-usage.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import roleMiddleware from '../../shared/middleware/role.middleware.js';

router.use(authToken);

router.get('/', companyUsageController.list);
router.get('/summary', companyUsageController.summary);
router.get('/budget', companyUsageController.getBudget);
router.put('/budget', roleMiddleware('Settings', 'Budget', 'update'), companyUsageController.updateBudget);

export default router;
