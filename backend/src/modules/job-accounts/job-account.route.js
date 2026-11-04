import express from 'express';
const router = express.Router();

import jobAccountController from './job-account.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', jobAccountController.getMyAccount);

router.post('/', jobAccountController.create);
//router.post('/:accountId/check-connection', jobAccountController.)

router.put('/:id', jobAccountController.update);

router.delete('/:id', jobAccountController.delete);

export default router;