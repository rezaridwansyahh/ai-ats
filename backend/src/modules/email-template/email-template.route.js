import express from 'express';
import EmailTemplateController from './email-template.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authToken, EmailTemplateController.getAll);
router.put('/:stage_type_id/:template_key', authToken, EmailTemplateController.save);

export default router;