import express from 'express';
const router = express.Router();

import leaveController from './leave.controller.js';

router.get('/', leaveController.getAll);
router.get('/saldo', leaveController.getSaldo);
router.get('/saldo/:nik', leaveController.getSaldoByNik);

router.post('/', leaveController.create);
router.post('/:id/resend', leaveController.resend);
router.get('/:id/link', leaveController.getLink);

router.put('/balance/:nik', leaveController.setBalance);

export default router;