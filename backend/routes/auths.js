import express from 'express';
const router = express.Router();

import AuthController from '../controllers/authController.js';

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

export default router;