import express from 'express';
const router = express.Router();

import applicantController from './applicant.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', applicantController.getAll);
router.get('/job-sourcing/:job_sourcing_id', applicantController.getByJobSourcingId);
router.get('/:id', applicantController.getById);
router.get('/:id/cv', applicantController.downloadCv);
router.get('/:id/sourcings', applicantController.getSourcingsByApplicantId);
router.get('/:id/score-history', applicantController.getScoreHistoryByApplicantId);
router.get('/company/:company_id', applicantController.getAllByCompanyId);
router.get('/score/company/:company_id', applicantController.getAllByCompanyWithScore)
router.get('/stats/company/:company_id', applicantController.getStatsByCompany)
router.get('/skills/company/:company_id', applicantController.getSkillsByCompany)


router.delete('/:id', applicantController.delete);

export default router;
