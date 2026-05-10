import assessmentBatteryResultService from './assessment-battery-result.service.js';

class AssessmentBatteryResultController {
  async getAll(req, res) {
    try {
      const results = await assessmentBatteryResultService.getAll();
      res.status(200).json({ message: 'List all assessment results', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const result = await assessmentBatteryResultService.getById(req.params.id);
      res.status(200).json({ message: 'Assessment result found', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByParticipantId(req, res) {
    try {
      const results = await assessmentBatteryResultService.getByParticipantId(req.params.participant_id);
      res.status(200).json({ message: 'Assessment results for participant', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getActiveProgress(req, res) {
    try {
      const progress = await assessmentBatteryResultService.getActiveProgress(
        req.params.participant_id,
        req.query.assessment_id,
      );
      res.status(200).json({ message: 'Active progress', progress });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async submit(req, res) {
    try {
      const { participant_id, assessment_id, answers, started_at, results, summary } = req.body;
      const result = await assessmentBatteryResultService.submit({
        participant_id, assessment_id, answers, started_at, results, summary,
      });
      res.status(201).json({ message: 'Assessment submitted', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateReport(req, res) {
    try {
      const result = await assessmentBatteryResultService.updateReport(req.params.id, req.body);
      res.status(200).json({ message: 'Report updated', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await assessmentBatteryResultService.delete(req.params.id);
      res.status(200).json({ message: 'Assessment result deleted', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AssessmentBatteryResultController();
