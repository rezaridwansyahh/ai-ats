import express from 'express';
const router = express.Router();

import employeeController from './employee.controller.js';
import { uploadDocument } from '../../shared/middleware/upload.middleware.js';

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.get('/:id/summary', employeeController.getSummary);

router.post('/', employeeController.create);
router.post('/:id/summary', employeeController.generateSummary);
router.post('/scan', uploadDocument, employeeController.scan);

router.put('/:id', employeeController.update);

router.delete('/:id', employeeController.delete);

export default router;