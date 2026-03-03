import candidateService from './candidate.service.js';

class CandidateController {
  async getAll(req, res) {
    try {
      const candidates = await candidateService.getAll();
      res.status(200).json({ message: 'List all candidates', candidates });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobPostingId(req, res) {
    try {
      const candidates = await candidateService.getByJobPostingId(req.params.job_posting_id);
      res.status(200).json({ message: 'Candidates for job posting', candidates });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const candidate = await candidateService.getById(req.params.id);
      res.status(200).json({ message: 'Candidate found', candidate });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const candidate = await candidateService.updateStatus(req.params.id, req.body.status);
      res.status(200).json({ message: `Candidate status updated to ${req.body.status}`, candidate });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const candidate = await candidateService.delete(req.params.id);
      res.status(200).json({ message: 'Candidate deleted', candidate });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async downloadCv(req, res) {
    try {
      const filePath = await candidateService.getCv(req.params.id);
      res.download(filePath);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new CandidateController();
