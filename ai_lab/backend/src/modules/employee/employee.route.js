import express from 'express';
const router = express.Router();

import employeeController from './employee.controller.js';

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

export default router;