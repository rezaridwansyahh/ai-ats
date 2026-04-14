import assessmentResultService from './assessment-result.service.js';

class AssessmentResultController {
  async getAll(req, res) {
    try {
      const results = await assessmentResultService.getAll();
      res.status(200).json({ message: 'List all assessment results', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const result = await assessmentResultService.getById(req.params.id);
      res.status(200).json({ message: 'Assessment result found', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByParticipantId(req, res) {
    try {
      const result = await assessmentResultService.getByParticipantId(req.params.participant_id);
      res.status(200).json({ message: 'Assessment result for participant', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByInstructorId(req, res) {
    try {
      const results = await assessmentResultService.getByInstructorId(req.params.instructor_id);
      res.status(200).json({ message: 'Assessment results for instructor', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { participant_id, instructor_id, test_name, date_test, score } = req.body;
      const result = await assessmentResultService.create(participant_id, instructor_id, test_name, date_test, score);
      res.status(201).json({ message: 'Assessment result created', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const result = await assessmentResultService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Assessment result updated', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await assessmentResultService.delete(req.params.id);
      res.status(200).json({ message: 'Assessment result deleted', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AssessmentResultController();
