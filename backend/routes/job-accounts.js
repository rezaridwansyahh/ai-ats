import express from 'express';
const router = express.Router();

import JobAccountController from '../controllers/JobAccountController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken);

router.get('/', JobAccountController.getAll);
router.get('/user/:user_id', JobAccountController.getByUserId);
router.get('/:id', JobAccountController.getById);

router.post('/', JobAccountController.create);

router.put('/:id', JobAccountController.update);

router.delete('/:id', JobAccountController.delete);

export default router;