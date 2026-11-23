import express from 'express';
const router = express.Router();

import jobAccountController from './account.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../shared/middleware/role-superadmin.middleware.js';

router.use(authToken);

router.get('/', jobAccountController.getMyAccount);

router.post('/', jobAccountController.create);
router.post('/:account_id/check-connection', jobAccountController.checkConnection);
router.post('/:account_id/sync-job-source', jobAccountController.syncJobSource);
router.post('/:account_id/extract-candidates/:job_sourcing_id', jobAccountController.extractCandidates);
router.post('/:account_id/debug-session', requireSuperAdmin, jobAccountController.openDebugSession);

router.put('/:id', jobAccountController.update);

router.delete('/:id', jobAccountController.delete);

export default router;