import express from 'express';
const router = express.Router();

import participantController from './participant.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', participantController.getAll);
router.get('/email/:email', participantController.getByEmail);
router.get('/:id', participantController.getById);

router.post('/', participantController.create);

router.put('/:id', participantController.update);

router.delete('/:id', participantController.delete);

export default router;
