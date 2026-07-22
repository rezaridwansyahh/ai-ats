import express from 'express';
const router = express.Router();

import screeningController from './screening.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import upload from '../../shared/middleware/upload.middleware.js';

router.use(authToken);

router.get('/search', screeningController.search);
router.get('/result', screeningController.getResult);
router.get('/application-form/template', screeningController.getApplicationFormTemplate);

router.post('/extract-facets/:applicant_id', upload.single('cv'), screeningController.extractFacets);
router.post('/score', screeningController.score);
router.post('/score-bulk/:job_id', screeningController.scoreBulk);

// AI Scoring (rubric flow)
router.get('/rubric/:job_id',                      screeningController.getRubric);
router.put('/rubric/:job_id',                      screeningController.saveRubric);
router.post('/match/:job_id',                      screeningController.scoreAllCandidates);   // score ALL in job
router.post('/job/:job_id/score-candidate',        screeningController.scoreCandidate);        // score ONE candidate
router.get('/match/:job_id/results',               screeningController.getMatchingResults);

// L1 Workboard + bulk lane actions (Phase 2)
router.get('/workboard',                           screeningController.getWorkboard);
router.get('/job/:job_id/lane',                    screeningController.getLaneCandidates);
router.post('/parse-bulk',                         screeningController.parseBulk);
router.post('/job/:job_id/match-bulk',             screeningController.scoreCandidatesList);  // score specific list

// L3 Candidate detail (Phase 3)
router.get('/screening/:screening_id',                screeningController.getScreening);
router.get('/by-candidate/:candidate_id',             screeningController.getScreeningByCandidateId);
router.patch('/screening/:screening_id/decision',     screeningController.setDecision);

// L4 Calibration (Phase 4)
router.get('/job/:job_id/calibration',                screeningController.getCalibration);
router.post('/job/:job_id/advance-bulk',              screeningController.advanceBulk);

// Follow-up Q&A — send side (generate / edit / send) + recruiter inbox (responses).
// Candidate-facing receive lives in the public portal-qa module.
router.get('/qa/inbox',                               screeningController.qaInbox);
router.get('/screening/:screening_id/qa',             screeningController.qaGet);
router.get('/screening/:screening_id/qa/responses',   screeningController.qaResponses);
router.post('/screening/:screening_id/qa/generate',   screeningController.qaGenerate);
router.put('/screening/:screening_id/qa',             screeningController.qaUpdate);
router.post('/screening/:screening_id/qa/send',       screeningController.qaSend);

export default router;
