import screeningService from './screening.service.js';

class ScreeningController {
  async extractFacets(req, res) {
    try {
      const applicant_id = Number(req.params.applicant_id);
      let result;
      if (req.file) {
        result = await screeningService.extractFacetsFromFile(applicant_id, req.file);
      } else if (req.body && typeof req.body.cv_text === 'string') {
        result = await screeningService.extractFacetsFromText(applicant_id, req.body.cv_text);
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
        Number(job_id)
      );
      res.status(200).json({ message: 'Candidate scored', score: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async scoreBulk(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const result = await screeningService.scoreBulkForJob(job_id);
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
