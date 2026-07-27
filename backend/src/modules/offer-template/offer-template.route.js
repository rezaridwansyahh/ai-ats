import express from 'express';
const router = express.Router();

import offerTemplateController from './offer-template.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';
import upload from '../../shared/middleware/offer.middleware.js';

router.use(authToken);

router.get( '/', checkPermission('Offer & Onboard', 'Offer & Contract', 'read'), offerTemplateController.getTemplate);

router.post( '/upload', checkPermission('Offer & Onboard', 'Offer & Contract', 'update'), upload.single('file'), offerTemplateController.uploadTemplate);

export default router;