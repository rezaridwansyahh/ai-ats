import express from 'express';
const router = express.Router();

import slaController from './sla.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/:jobId', slaController.getByJobId);
router.put('/:jobId', slaController.create);

export default router;
