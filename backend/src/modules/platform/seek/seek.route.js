import { Router } from "express";
import seekController from "./seek.controller.js";

const router = Router();

router.post('/job-post/rpa/create', seekController.jobPostRpa);
router.post('/job-post-draft/rpa/create', seekController.jobPostDraftRpa);

router.post('/job-post-draft/rpa/delete', seekController.deleteJobPostDraftRpa);
router.post('/job-post-draft/rpa/update', seekController.updateJobPostDraftRpa);

router.post('/job-post/rpa/sync', seekController.jobPostSyncRpa);

router.post('/check-connection', seekController.checkConnectionRpa);

router.post('/candidates/rpa/extract', seekController.extractCandidatesRpa);

router.post('/sync-all', seekController.syncAllRpa);

router.get('/job-status/:jobId', seekController.getJobStatus);

export default router;