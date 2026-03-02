import express from 'express';
const router = express.Router();

import ModuleController from '../controllers/ModuleController.js';
import authToken from '../middlewares/authMiddleware.js';
import checkPermission from'../middlewares/roleMiddleware.js';

router.use(authToken); 

router.get('/', ModuleController.getAll);
router.get('/menu/:menu_id', ModuleController.getByMenuId);
router.get('/:id', checkPermission('Settings', 'General', 'read', { allowedRoles: ['Admin', 'Manager', 'Staff'] }), ModuleController.getById);

router.post('/', ModuleController.create);
router.put('/:id', ModuleController.update);
router.delete('/:id', ModuleController.delete);

export default router;