import express from 'express';
const router = express.Router();

import JobPostingController from '../controllers/JobPostingController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken);

router.get('/', JobPostingController.getAll);
router.get('/user/:user_id', JobPostingController.getByUserId);
router.get('/user/:user_id/status', JobPostingController.getByUserIdAndStatus);
router.get('/user/:user_id/full', JobPostingController.getSeekByUserId);
router.get('/:id', JobPostingController.getById);
router.get('/:id/full', JobPostingController.getFullById);

router.post('/seek', JobPostingController.submitSeek);

router.put('/:id', JobPostingController.update);
router.put('/:id/status', JobPostingController.updateStatus);

router.delete('/:id', JobPostingController.delete);

export default router;
