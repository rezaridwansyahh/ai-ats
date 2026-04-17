import express from 'express';
const router = express.Router();

import applicantController from './applicant.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', applicantController.getAll);
router.get('/job-sourcing/:job_sourcing_id', applicantController.getByJobSourcingId);
router.get('/:id', applicantController.getById);
router.get('/:id/cv', applicantController.downloadCv);

router.delete('/:id', applicantController.delete);

export default router;
