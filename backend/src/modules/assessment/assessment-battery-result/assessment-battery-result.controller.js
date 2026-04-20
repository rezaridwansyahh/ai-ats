import assessmentBatteryResultService from './assessment-battery-result.service.js';

class AssessmentBatteryResultController {
  async getAll(req, res) {
    try {
      const results = await assessmentBatteryResultService.getAll();
      res.status(200).json({ message: 'List all assessment battery results', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const result = await assessmentBatteryResultService.getById(req.params.id);
      res.status(200).json({ message: 'Assessment battery result found', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByToken(req, res) {
    try {
      const result = await assessmentBatteryResultService.getByToken(req.params.token);
      res.status(200).json({ message: 'Assessment battery result found', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getBySessionId(req, res) {
    try {
      const result = await assessmentBatteryResultService.getBySessionId(req.params.session_id);
      res.status(200).json({ message: 'Assessment battery result found', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async submitByToken(req, res) {
    try {
      const { profile, result } = req.body;
      const data = await assessmentBatteryResultService.submitByToken(req.params.token, profile, result);
      res.status(201).json({ message: 'Assessment submitted', ...data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async saveReport(req, res) {
    try {
      const { report } = req.body;
      const result = await assessmentBatteryResultService.saveReport(req.params.session_id, report);
      res.status(200).json({ message: 'Report saved', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async generateReport(req, res) {
    try {
      const result = await assessmentBatteryResultService.generateReport(req.params.session_id);
      res.status(200).json({ message: 'Report generated', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateRecruiterReview(req, res) {
    try {
      const { recruiter_recommendation, recruiter_note, report } = req.body;
      const result = await assessmentBatteryResultService.updateRecruiterReview(req.params.session_id, {
        recruiter_recommendation,
        recruiter_note,
        report,
      });
      res.status(200).json({ message: 'Recruiter review updated', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const result = await assessmentBatteryResultService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Assessment battery result updated', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await assessmentBatteryResultService.delete(req.params.id);
      res.status(200).json({ message: 'Assessment battery result deleted', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AssessmentBatteryResultController();
