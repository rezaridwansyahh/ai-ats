import express from 'express';
const router = express.Router();

import moduleController from './module.controller.js';

router.get('/', moduleController.getAll);
router.get('/navigation', moduleController.getNavigation);
router.get('/menu/:menu_id', moduleController.getByMenuId);
router.get('/:id', moduleController.getById);

router.post('/', moduleController.create);
router.put('/:id', moduleController.update);
router.delete('/:id', moduleController.delete);

export default router;