import { Router } from "express";
import linkedinController from "./linkedin.controller.js";

const router = Router();

router.post('/job-post/rpa/create', linkedinController.jobPostRpa);
router.post('/project/rpa/create', linkedinController.projectCreateRpa);
router.post('/recruite-search/rpa/create', linkedinController.recruiteSearchRpa);
router.post('/extract-applicant/rpa', linkedinController.extractApplicantRpa);

export default router;