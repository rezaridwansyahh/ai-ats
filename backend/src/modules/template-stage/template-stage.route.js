import express from 'express';
const router = express.Router();
import templateStageController from './template-stage.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', templateStageController.getAll);
router.get('/:id', templateStageController.getById);

export default router;
