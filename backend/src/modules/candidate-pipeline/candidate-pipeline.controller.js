import candidatePipelineService from './candidate-pipeline.service.js';

class CandidatePipelineController {
  async getAll(req, res) {
    try {
      const pipelines = await candidatePipelineService.getAll();
      res.status(200).json({ message: 'List all candidate pipelines', pipelines });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const pipeline = await candidatePipelineService.getById(req.params.id);
      res.status(200).json({ message: 'Candidate pipeline found', pipeline });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const pipelines = await candidatePipelineService.getByJobId(req.params.job_id);
      res.status(200).json({ message: 'Candidate pipelines for job', pipelines });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByApplicantId(req, res) {
    try {
      const pipelines = await candidatePipelineService.getByApplicantId(req.params.applicant_id);
      res.status(200).json({ message: 'Candidate pipelines for applicant', pipelines });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const pipeline = await candidatePipelineService.create(req.body);
      res.status(201).json({ message: 'Candidate pipeline created', pipeline });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const pipeline = await candidatePipelineService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Candidate pipeline updated', pipeline });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const pipeline = await candidatePipelineService.delete(req.params.id);
      res.status(200).json({ message: 'Candidate pipeline deleted', pipeline });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getStages(req, res) {
    try {
      const stages = await candidatePipelineService.getStages(req.params.id);
      res.status(200).json({ message: 'Candidate pipeline stage history', stages });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addStage(req, res) {
    try {
      const result = await candidatePipelineService.addStage(req.params.id, req.body);
      res.status(201).json({ message: 'Stage recorded', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async email(req, res) {
    try {
      const result = await candidatePipelineService.email(req.params.id, req.body || {});
      res.status(200).json({ message: 'Test email sent', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new CandidatePipelineController();
