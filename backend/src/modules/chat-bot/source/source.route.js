import express from 'express';
const router = express.Router();

import SourceController from './source.controller.js';
import upload from '../../../shared/middleware/soure.middleware.js';
import requireAuth from '../../../shared/middleware/auth.middleware.js'; 

router.post('/', requireAuth, upload.single('file'), SourceController.upload);
router.get('/', requireAuth, SourceController.list);
router.delete('/:id', requireAuth, SourceController.remove);

export default router;