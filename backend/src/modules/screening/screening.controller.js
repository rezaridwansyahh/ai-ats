import screeningService from './screening.service.js';

function ctxFromReq(req) {
  return {
    company_id: req.user?.company_id ?? null,
    user_id:    req.user?.user_id    ?? null,
  };
}

class ScreeningController {
  async extractFacets(req, res) {
    try {
      const applicant_id = Number(req.params.applicant_id);
      const context = ctxFromReq(req);
      let result;
      if (req.file) {
        result = await screeningService.extractFacetsFromFile(applicant_id, req.file, context);
      } else if (req.body && typeof req.body.cv_text === 'string') {
        result = await screeningService.extractFacetsFromText(applicant_id, req.body.cv_text, context);
      } else {
        throw { status: 400, message: 'Provide a `cv` file upload or a `cv_text` body field' };
      }
      res.status(200).json({ message: 'Facets extracted', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async score(req, res) {
    try {
      const { applicant_id, job_id } = req.body || {};
      const result = await screeningService.scoreApplicantForJob(
        Number(applicant_id),
        Number(job_id),
        ctxFromReq(req)
      );
      res.status(200).json({ message: 'Candidate scored', score: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async scoreBulk(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const result = await screeningService.scoreBulkForJob(job_id, ctxFromReq(req));
      res.status(200).json({ message: 'Bulk scoring complete', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getResult(req, res) {
    try {
      const applicant_id = Number(req.query.applicant_id);
      const job_id = Number(req.query.job_id);
      const result = await screeningService.getResult(applicant_id, job_id);
      if (!result) {
        return res.status(404).json({ message: 'No score found for this applicant + job' });
      }
      res.status(200).json({ message: 'Score found', score: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getRubric(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const rubric = await screeningService.getRubric(job_id);
      res.status(200).json({ message: 'Rubric fetched', rubric });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async saveRubric(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const rubric = req.body?.rubric;
      const saved = await screeningService.saveRubric(job_id, rubric);
      res.status(200).json({ message: 'Rubric saved', rubric: saved });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async runMatching(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { rubric, role_profile } = req.body || {};
      const result = await screeningService.runMatching(job_id, {
        rubric,
        role_profile,
        context: ctxFromReq(req),
      });
      res.status(200).json({ message: 'AI matching complete', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getMatchingResults(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const results = await screeningService.getMatchingResults(job_id);
      res.status(200).json({ message: 'Match results fetched', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // L3 — fetch a single candidate's screening detail
  async getScreening(req, res) {
    try {
      const screening_id = Number(req.params.screening_id);
      const result = await screeningService.getScreening(screening_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Screening detail', screening: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // L3 — lazy-create + fetch by master_candidate.id
  async getScreeningByCandidateId(req, res) {
    try {
      const candidate_id = Number(req.params.candidate_id);
      const result = await screeningService.getScreeningByCandidateId(candidate_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Screening detail', screening: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // L4 — calibration cohort
  async getCalibration(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const rows = await screeningService.getCalibration(job_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Calibration cohort', rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // L4 — bulk advance to Interview
  async advanceBulk(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { screening_ids, decision_reason } = req.body || {};
      const result = await screeningService.advanceBulk(job_id, {
        screening_ids,
        decision_reason,
        decided_by: req.user?.user_id || null,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Advance-bulk complete', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // L3 / L4 — recruiter decision
  async setDecision(req, res) {
    try {
      const screening_id = Number(req.params.screening_id);
      const { decision, decision_reason } = req.body || {};
      const result = await screeningService.setDecision({
        screening_id,
        decision,
        decision_reason,
        decided_by: req.user?.user_id || null,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Decision saved', screening: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getWorkboard(req, res) {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) {
        return res.status(400).json({ message: 'No company_id on token' });
      }
      const data = await screeningService.getWorkboard(company_id);
      res.status(200).json({ message: 'Workboard fetched', ...data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getLaneCandidates(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const engine = req.query.engine || null;
      const candidates = await screeningService.getLaneCandidates(job_id, engine);
      res.status(200).json({ message: 'Lane candidates', candidates });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async parseBulk(req, res) {
    try {
      const { applicant_ids } = req.body || {};
      const result = await screeningService.parseBulk(applicant_ids, ctxFromReq(req));
      res.status(200).json({ message: 'Parse-bulk complete', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async matchBulk(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { applicant_ids, force } = req.body || {};
      const result = await screeningService.matchBulk(job_id, applicant_ids, {
        force: !!force,
        context: ctxFromReq(req),
      });
      res.status(200).json({ message: 'Match-bulk complete', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async search(req, res) {
    try {
      const {
        mode = 'pool',
        job_id,
        q,
        position_q,
        skill_q,
        education_q,
        location_q,
        position,
        skills,
        skills_mode,
        min_years,
        education_tier,
        min_score,
        page,
        limit,
      } = req.query;

      const skillsArray =
        Array.isArray(skills)
          ? skills
          : typeof skills === 'string' && skills.length
            ? skills.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

      const result = await screeningService.search({
        mode,
        job_id: job_id ? Number(job_id) : null,
        q: typeof q === 'string' ? q : null,
        position_q:  typeof position_q  === 'string' ? position_q  : null,
        skill_q:     typeof skill_q     === 'string' ? skill_q     : null,
        education_q: typeof education_q === 'string' ? education_q : null,
        location_q:  typeof location_q  === 'string' ? location_q  : null,
        position: position || null,
        skills: skillsArray,
        skills_mode: skills_mode === 'any' ? 'any' : 'all',
        min_years: min_years != null && min_years !== '' ? Number(min_years) : null,
        education_tier: education_tier || null,
        min_score: min_score != null && min_score !== '' ? Number(min_score) : null,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.status(200).json({ message: 'Search results', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ScreeningController();
