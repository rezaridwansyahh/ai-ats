import express from 'express';
const router = express.Router();
import stageCategoryController from './stage-category.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', stageCategoryController.getAll);

export default router;
