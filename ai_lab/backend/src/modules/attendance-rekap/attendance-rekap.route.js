import express from 'express';
const router = express.Router();

import rekapController from './attendance-rekap.controller.js';

router.get('/', rekapController.getAll);
router.get('/export', rekapController.exportXlsx);
router.get('/:nik', rekapController.getByNik);

export default router;