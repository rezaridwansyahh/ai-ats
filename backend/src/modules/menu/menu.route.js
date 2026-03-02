import express from 'express';
const router = express.Router();

import menuController from './menu.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken); 

router.get('/', menuController.getAll);
router.get('/module/:module_id', menuController.getByModuleId);
router.get('/:id', menuController.getById);

router.post('/', menuController.create);

router.put('/:id', menuController.update);

router.delete('/:id', menuController.delete);

export default router;