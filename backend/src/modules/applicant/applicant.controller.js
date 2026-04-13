import applicantService from './applicant.service.js';

class ApplicantController {
  async getAll(req, res) {
    try {
      const applicants = await applicantService.getAll();
      res.status(200).json({ message: 'List all applicants', applicants });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const applicant = await applicantService.getById(req.params.id);
      res.status(200).json({ message: 'Applicant found', applicant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const applicants = await applicantService.getByJobId(req.params.job_id);
      res.status(200).json({ message: 'Applicants for job', applicants });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const applicant = await applicantService.create(req.body);
      res.status(201).json({ message: 'Applicant created', applicant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const applicant = await applicantService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Applicant updated', applicant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const applicant = await applicantService.delete(req.params.id);
      res.status(200).json({ message: 'Applicant deleted', applicant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getStages(req, res) {
    try {
      const stages = await applicantService.getStages(req.params.id);
      res.status(200).json({ message: 'Applicant stage history', stages });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addStage(req, res) {
    try {
      const result = await applicantService.addStage(req.params.id, req.body);
      res.status(201).json({ message: 'Stage recorded', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ApplicantController();
