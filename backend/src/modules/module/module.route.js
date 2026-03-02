import express from 'express';
const router = express.Router();

import moduleController from './module.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from'../../shared/middleware/role.middleware.js';

router.use(authToken); 

router.get('/', moduleController.getAll);
router.get('/menu/:menu_id', moduleController.getByMenuId);
router.get('/:id', checkPermission('Settings', 'General', 'read', { allowedRoles: ['Admin', 'Manager', 'Staff'] }), moduleController.getById);

router.post('/', moduleController.create);
router.put('/:id', moduleController.update);
router.delete('/:id', moduleController.delete);

export default router;