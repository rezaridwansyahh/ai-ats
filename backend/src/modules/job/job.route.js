import express from 'express';
const router = express.Router();

import jobController from './job.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', jobController.getAll);
router.get('/status', jobController.getByStatus);
router.get('/:id', jobController.getById);
router.get('/:id/sourcings', jobController.getWithSourcings);

router.post('/', jobController.create);

router.put('/:id', jobController.update);
router.put('/:id/status', jobController.updateStatus);

router.delete('/:id', jobController.delete);

export default router;
