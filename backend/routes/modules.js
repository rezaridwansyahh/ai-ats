import express from 'express';
const router = express.Router();

import ModuleController from '../controllers/ModuleController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken); 

router.get('/', ModuleController.getAll);
router.get('/menu/:menu_id', ModuleController.getByMenuId);
router.get('/:id', ModuleController.getById);

router.post('/', ModuleController.create);

router.put('/:id', ModuleController.update);

router.delete('/:id', ModuleController.delete);

export default router;