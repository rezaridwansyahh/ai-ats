import express from 'express';
const router = express.Router();

import applicantController from './applicant.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', applicantController.getAll);
router.get('/job/:job_id', applicantController.getByJobId);
router.get('/:id/stages', applicantController.getStages);
router.get('/:id', applicantController.getById);

router.post('/', applicantController.create);
router.post('/:id/stages', applicantController.addStage);

router.put('/:id', applicantController.update);

router.delete('/:id', applicantController.delete);

export default router;
