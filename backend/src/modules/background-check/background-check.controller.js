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

  async getClaims(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const rows = await backgroundCheckService.getClaims(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Claims fetched', claims: rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async extractClaims(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const rows = await backgroundCheckService.extractClaims(
        bg_id,
        { company_id: req.user?.company_id || null },
        { company_id: req.user?.company_id || null, user_id: req.user?.user_id || null }
      );
      res.status(200).json({ message: 'Claims extracted', claims: rows });
    } catch (err) {
      if (err.status === 422) {
        return res.status(422).json({ message: err.message, manual_required: true });
      }
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addClaim(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const { claim_text, claim_detail, lane_type } = req.body || {};
      const result = await backgroundCheckService.addClaim(bg_id, {
        claim_text,
        claim_detail,
        lane_type,
        company_id: req.user?.company_id || null,
      });
      res.status(201).json({ message: 'Claim added', claim: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateClaim(req, res) {
    try {
      const claim_id = Number(req.params.claim_id);
      const { claim_text, claim_detail, lane_type } = req.body || {};
      const result = await backgroundCheckService.updateClaim(claim_id, {
        claim_text,
        claim_detail,
        lane_type,
        company_id: req.user?.company_id || null,
        edited_by:  req.user?.user_id    || null,
      });
      res.status(200).json({ message: 'Claim updated', claim: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async toggleClaim(req, res) {
    try {
      const claim_id = Number(req.params.claim_id);
      const { selected } = req.body || {};
      const result = await backgroundCheckService.toggleClaim(claim_id, {
        selected,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Claim updated', claim: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async deleteClaim(req, res) {
    try {
      const claim_id = Number(req.params.claim_id);
      const result = await backgroundCheckService.deleteClaim(claim_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Claim deleted', claim: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async confirmClaims(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const result = await backgroundCheckService.confirmClaims(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Claims confirmed — advanced to consent', bg_check: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getConsent(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const result = await backgroundCheckService.getConsent(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Consent fetched', consent: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async generateConsentLink(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const result = await backgroundCheckService.generateConsentLink(bg_id, {
        company_id: req.user?.company_id || null,
        sent_by:    req.user?.user_id    || null,
      });
      res.status(200).json({ message: 'Consent link generated', consent: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async revokeConsent(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const { revocation_reason } = req.body || {};
      const result = await backgroundCheckService.revokeConsent(bg_id, {
        revocation_reason,
        company_id: req.user?.company_id || null,
        revoked_by: req.user?.user_id    || null,
      });
      res.status(200).json({ message: 'Consent revoked', consent: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getLanes(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const rows = await backgroundCheckService.getLanes(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Lanes fetched', lanes: rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async createFromClaims(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const rows = await backgroundCheckService.createFromClaims(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Lanes created', lanes: rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateTracker(req, res) {
    try {
      const lane_id = Number(req.params.lane_id);
      const { note, status } = req.body || {};
      const result = await backgroundCheckService.updateTracker(lane_id, {
        note,
        status,
        resolved_by: req.user?.user_id    || null,
        company_id:  req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Lane updated', lane: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getLaneCounts(req, res) {
    try {
      const bg_id = Number(req.params.bg_id);
      const counts = await backgroundCheckService.getLaneCounts(bg_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Counts fetched', counts });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

}

export default new BackgroundCheckController();