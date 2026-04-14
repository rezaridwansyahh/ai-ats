import express from 'express';
const router = express.Router();

import instructorController from './instructor.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', instructorController.getAll);
router.get('/email/:email', instructorController.getByEmail);
router.get('/:id', instructorController.getById);

router.post('/', instructorController.create);

router.put('/:id', instructorController.update);

router.delete('/:id', instructorController.delete);

export default router;
