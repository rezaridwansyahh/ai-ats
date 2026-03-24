import recruiterService from './recruiter.service.js';

class RecruiterController {
  async getAll(req, res) {
    try {
      const recruiters = await recruiterService.getAll();
      res.status(200).json({ message: "List all Recruiters", recruiters });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const recruiter = await recruiterService.getById(req.params.id);
      res.status(200).json({ message: "Recruiter details", recruiter });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const recruiter = await recruiterService.create(req.body);
      res.status(201).json({ message: "Recruiter created successfully", recruiter });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const recruiter = await recruiterService.update(req.params.id, req.body);
      res.status(200).json({ message: "Recruiter updated successfully", recruiter });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const recruiter = await recruiterService.delete(req.params.id);
      res.status(200).json({ message: "Recruiter deleted successfully", recruiter });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new RecruiterController();
