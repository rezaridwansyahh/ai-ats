import express from 'express';
import authToken from '../../shared/middleware/auth.middleware.js';
import InterviewPackController from './interview-pack.controller.js';

const router = express.Router();

// All admin routes require authentication
router.use(authToken);

router.post('/', InterviewPackController.create);
router.get('/', InterviewPackController.getAll);
router.get('/:id', InterviewPackController.getById);
router.delete('/:id', InterviewPackController.delete);

export default router;
