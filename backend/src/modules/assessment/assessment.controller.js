import assessmentService from './assessment.service.js';

class AssessmentController {
  async getWorkboard(req, res) {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'No company_id on token' });
      const data = await assessmentService.getWorkboard(company_id);
      res.status(200).json({ message: 'Workboard fetched', ...data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const candidates = await assessmentService.getByJobId(req.params.job_id);
      res.status(200).json({ message: 'Candidates fetched', candidates });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AssessmentController();
