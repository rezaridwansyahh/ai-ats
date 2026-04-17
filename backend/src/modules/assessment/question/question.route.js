import express from 'express';
const router = express.Router();

import questionController from './question.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', questionController.getAll);
router.get('/:id', questionController.getById);

router.post('/', questionController.create);

router.put('/:id', questionController.update);

router.delete('/:id', questionController.delete);

export default router;
