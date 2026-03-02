import { Router } from "express";
import linkedinController from "./linkedin.controller.js";

const router = Router();

router.post('/job-post/rpa/create', linkedinController.jobPostRpa);
router.post('/project/rpa/create', linkedinController.projectCreateRpa);

export default router;
