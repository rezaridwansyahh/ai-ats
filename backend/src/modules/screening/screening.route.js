import express from 'express';
const router = express.Router();

import screeningController from './screening.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import upload from '../../shared/middleware/upload.middleware.js';

router.use(authToken);

router.get('/search', screeningController.search);
router.get('/result', screeningController.getResult);

router.post('/extract-facets/:applicant_id', upload.single('cv'), screeningController.extractFacets);
router.post('/score', screeningController.score);
router.post('/score-bulk/:job_id', screeningController.scoreBulk);

// AI Matching (rubric flow)
router.get('/rubric/:job_id',  screeningController.getRubric);
router.put('/rubric/:job_id',  screeningController.saveRubric);
router.post('/match/:job_id',  screeningController.runMatching);
router.get('/match/:job_id/results', screeningController.getMatchingResults);

export default router;
