import express from 'express';
const router = express.Router();

import companyUsageController from './company-usage.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', companyUsageController.list);
router.get('/summary', companyUsageController.summary);

export default router;
