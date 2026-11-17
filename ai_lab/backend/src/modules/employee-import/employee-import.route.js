import express from 'express';
const router = express.Router();

import importController from './employee-import.controller.js';
import { uploadSpreadsheet } from '../../shared/middleware/upload.middleware.js';

router.post('/preview', uploadSpreadsheet, importController.preview);
router.post('/validate', uploadSpreadsheet, importController.validate);
router.post('/commit', uploadSpreadsheet, importController.commit);

export default router;