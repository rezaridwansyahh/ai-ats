import express from 'express';
const router = express.Router();

import importController from './attendance-import.controller.js';
import { uploadSpreadsheet } from '../../shared/middleware/upload.middleware.js';

router.post('/preview', uploadSpreadsheet, importController.preview);
router.post('/validate', uploadSpreadsheet, importController.validate);
router.post('/commit', uploadSpreadsheet, importController.commit);
router.post('/:id/undo', importController.undo);

export default router;