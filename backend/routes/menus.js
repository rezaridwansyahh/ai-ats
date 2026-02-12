import express from 'express';
const router = express.Router();

import MenuController from '../controllers/MenuController.js';
import authToken from '../middlewares/authMiddleware.js';

router.use(authToken); 

router.get('/', MenuController.getAll);
router.get('/module/:module_id', MenuController.getByModuleId);
router.get('/:id', MenuController.getById);

router.post('/', MenuController.create);

router.put('/:id', MenuController.update);

router.delete('/:id', MenuController.delete);

export default router;