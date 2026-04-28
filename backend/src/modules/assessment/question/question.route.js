import express from 'express';
const router = express.Router();

import questionController from './question.controller.js';
import authToken from '../../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', questionController.getAllAssessments);
router.get('/assessment/:code/subtest/:subtest', questionController.getBySubtest);
router.get('/assessment/:code', questionController.getByAssessmentCode);
router.get('/:id', questionController.getById);

export default router;
