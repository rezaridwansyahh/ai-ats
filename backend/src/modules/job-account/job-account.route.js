import express from 'express';
const router = express.Router();

import jobAccountController from './job-account.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', jobAccountController.getAll);
router.get('/user/:user_id', jobAccountController.getByUserId);
router.get('/:id', jobAccountController.getById);

router.post('/', jobAccountController.create);

router.put('/:id', jobAccountController.update);

router.delete('/:id', jobAccountController.delete);

export default router;