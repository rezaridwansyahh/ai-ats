import jobService from './job.service.js';

class JobController {
  async getAll(req, res) {
    try {
      const jobs = await jobService.getAll();
      res.status(200).json({ message: 'List all Jobs', jobs });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const job = await jobService.getById(req.params.id);
      res.status(200).json({ message: 'Job found', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByStatus(req, res) {
    try {
      const jobs = await jobService.getByStatus(req.query.status);
      res.status(200).json({ message: `List of ${req.query.status} Jobs`, jobs });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getWithSourcings(req, res) {
    try {
      const job = await jobService.getWithSourcings(req.params.id);
      res.status(200).json({ message: 'Job with sourcings', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const job = await jobService.create(req.body);
      res.status(201).json({ message: 'Job created', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const job = await jobService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Job updated', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const job = await jobService.updateStatus(req.params.id, req.body.status);
      res.status(200).json({ message: `Job status updated to ${req.body.status}`, job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const job = await jobService.delete(req.params.id);
      res.status(200).json({ message: 'Job deleted', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new JobController();
