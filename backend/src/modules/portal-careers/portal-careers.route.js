import express from 'express';
const router = express.Router();

import portalCareersController from './portal-careers.controller.js';
import upload from '../../shared/middleware/upload.middleware.js';

// Fully public — no authToken. Mirrors the other portal-* modules
// (portal-assessment, portal-qa, ...) that serve unauthenticated candidates.
router.get('/:slug', portalCareersController.getCompanyCareers);
router.get('/:slug/jobs/:job_id', portalCareersController.getJobDetail);
router.post('/:slug/jobs/:job_id/apply', upload.single('cv'), portalCareersController.apply);

export default router;
