import backgroundCheckService from './background-check.service.js';

class BackgroundCheckController {
  async getWorkboard(req, res) {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'No company_id on token' });

      const data = await backgroundCheckService.getWorkboard(company_id);
      res.status(200).json({ message: 'Workboard fetched', ...data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJob(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const rows = await backgroundCheckService.getByJob(job_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Background checks fetched', bg_checks: rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const result = await backgroundCheckService.getById(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Background check fetched', bg_check: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByCandidateId(req, res) {
    try {
      const candidate_id = Number(req.params.candidate_id);
      const result = await backgroundCheckService.getByCandidateId(candidate_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Background check fetched', bg_check: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const { status } = req.body || {};
      const result = await backgroundCheckService.updateStatus(bg_id, {
        status,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Status updated', bg_check: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async saveVerdict(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const { verdict, verdict_note } = req.body || {};
      const result = await backgroundCheckService.saveVerdict(bg_id, {
        verdict,
        verdict_note,
        decided_by: req.user?.user_id    || null,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Verdict saved', bg_check: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async archive(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const { archived_reason } = req.body || {};
      const result = await backgroundCheckService.archive(bg_id, {
        archived_reason,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Record archived', bg_check: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

}

export default new BackgroundCheckController();