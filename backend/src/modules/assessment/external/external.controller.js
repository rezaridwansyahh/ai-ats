import externalAssessmentService from './external.service.js';

class ExternalAssessmentController {
  async getByCandidateJob(req, res) {
    try {
      const { candidate_id, job_id } = req.query;
      const record = await externalAssessmentService.getByCandidateJob(
        candidate_id != null ? Number(candidate_id) : null,
        job_id != null ? Number(job_id) : null,
      );
      res.status(200).json({ message: 'External assessment record', record });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async previewInvitation(req, res) {
    try {
      const { candidate_id, job_id, assessment_url } = req.body;
      const { company_id } = req.user;
      const result = await externalAssessmentService.previewInvitation({
        candidate_id, job_id, assessment_url, company_id,
      });
      res.status(200).json({ message: 'Invitation preview', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async sendInvitation(req, res) {
    try {
      const { candidate_id, job_id, assessment_url, subject, body } = req.body;
      const { company_id } = req.user;
      const sent_by = req.user?.id ?? null;
      const result = await externalAssessmentService.sendInvitation({
        candidate_id, job_id, assessment_url, sent_by, company_id, subject, body,
      });
      res.status(200).json({ message: 'Invitation sent', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async recordDecision(req, res) {
    try {
      const { decision } = req.body;
      const decided_by = req.user?.id ?? null;
      const record = await externalAssessmentService.recordDecision(req.params.id, { decision, decided_by });
      res.status(200).json({ message: 'Decision recorded', record });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ExternalAssessmentController();
