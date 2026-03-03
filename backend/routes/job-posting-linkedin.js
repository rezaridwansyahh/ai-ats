import express from 'express';
const router = express.Router();

import JobPostingLinkedInController from '../controllers/JobPostingLinkedInController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken);

router.get('/', JobPostingLinkedInController.getAll);
router.get('/posting/:job_posting_id', JobPostingLinkedInController.getByJobPostingId);
router.get('/posting/:job_posting_id/full', JobPostingLinkedInController.getDetailsByJobPostingId);
router.get('/:id', JobPostingLinkedInController.getById);

router.put('/posting/:job_posting_id', JobPostingLinkedInController.update);

router.delete('/posting/:job_posting_id', JobPostingLinkedInController.delete);

export default router;