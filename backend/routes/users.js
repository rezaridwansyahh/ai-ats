import express from 'express';
const router = express.Router();

import UserController from '../controllers/UserController.js';
import authToken from '../middlewares/authMiddleware.js';
import checkPermission from '../middlewares/roleMiddleware.js';

router.use(authToken);

router.get('/roles/all', UserController.getMasterRoles);
router.get('/',UserController.getAllWithRoles);
router.get('/:id',UserController.getByIdWithRoles);

router.post('/',UserController.create);

router.put('/:id',UserController.update);

router.delete('/:id',UserController.delete);

export default router;