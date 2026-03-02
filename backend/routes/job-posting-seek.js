import express from 'express';
const router = express.Router();

import JobPostingSeekController from '../controllers/JobPostingSeekController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken);

router.get('/', JobPostingSeekController.getAll);
router.get('/posting/:job_posting_id', JobPostingSeekController.getByJobPostingId);
router.get('/posting/:job_posting_id/full', JobPostingSeekController.getDetailsByJobPostingId);
router.get('/:id', JobPostingSeekController.getById);

router.put('/posting/:job_posting_id', JobPostingSeekController.update);

router.delete('/posting/:job_posting_id', JobPostingSeekController.delete);

export default router;