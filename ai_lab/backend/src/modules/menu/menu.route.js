import express from 'express';
const router = express.Router();

import menuController from './menu.controller.js';

router.get('/', menuController.getAll);
router.get('/:id', menuController.getById);

router.post('/', menuController.create);
router.put('/:id', menuController.update);
router.delete('/:id', menuController.delete);

export default router;