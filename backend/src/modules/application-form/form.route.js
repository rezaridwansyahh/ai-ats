import express from 'express';
import formController from './form.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.use(authToken);

router.get('/company', formController.getCompanyForm);

export default router;