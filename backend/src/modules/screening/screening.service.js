import screeningModel from './screening.model.js';
import jobModel from '../job/job.model.js';
import automationModel from '../automation-setting/automation.model.js';
import aiService from '../../shared/services/ai.service.js';
import { parseFileToText } from '../../shared/utils/file-parser.js';

class ScreeningService {
  // Layer 1 — extract facets from a CV file (multer file object).
  async extractFacetsFromFile(applicant_id, file, context = {}) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    if (!file) throw { status: 400, message: 'cv file is required' };

    const applicant = await screeningModel.getApplicant(applicant_id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };

    let cvText;
    try {
      cvText = await parseFileToText(file);
    } catch (err) {
      throw { status: 400, message: `Failed to parse CV: ${err.message}` };
    }
    if (!cvText || !cvText.trim()) {
      throw { status: 400, message: 'CV is empty after parsing' };
    }

    return this._extractAndStore(applicant_id, cvText, context);
  }

  // Layer 1 — extract facets from raw text (useful when CV text is already available).
  async extractFacetsFromText(applicant_id, cvText, context = {}) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    if (!cvText || typeof cvText !== 'string' || !cvText.trim()) {
      throw { status: 400, message: 'cv_text is required' };
    }
    const applicant = await screeningModel.getApplicant(applicant_id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };

    return this._extractAndStore(applicant_id, cvText, context);
  }

  async _extractAndStore(applicant_id, cvText, context = {}) {
    const aiContext = {
      ...context,
      metadata: { applicant_id, ...(context.metadata || {}) },
    };
    const facets = await aiService.extractFacets(cvText, aiContext);
    const updated = await screeningModel.setApplicantInformation(applicant_id, facets);
    return { applicant: updated, facets };
  }

  // Layer 2 — score one applicant against one job.
  async scoreApplicantForJob(applicant_id, job_id, context = {}) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const applicant = await screeningModel.getApplicant(applicant_id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    if (!applicant.information) {
      throw {
        status: 400,
        message: 'Applicant has no extracted facets. Run Layer 1 (extract-facets) first.',
      };
    }

    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    const aiContext = {
      ...context,
      metadata: { applicant_id, job_id, ...(context.metadata || {}) },
    };
    const score = await aiService.scoreApplicantAgainstJob(job, applicant.information, aiContext);
    const stored = await screeningModel.upsertScore({
      applicant_id,
      job_id,
      ...score,
    });
    return stored;
  }

  // Bulk re-score every candidate already in the pipeline for this job.
  async scoreBulkForJob(job_id, context = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    const candidates = await screeningModel.getCandidatesByJob(job_id);
    const results = [];
    const errors = [];

    for (const c of candidates) {
      try {
        const stored = await this.scoreApplicantForJob(c.applicant_id, job_id, context);
        results.push(stored);
      } catch (err) {
        errors.push({ applicant_id: c.applicant_id, message: err.message || String(err) });
      }
    }
    return { scored: results.length, errors, results };
  }

  // Returns the automation decision applied for a candidate after Layer 2.
  // Caller is responsible for actually moving the candidate's stage / sending notifications.
  async resolveAutomationDecision(job_id, score) {
    if (!score || typeof score.overall_score !== 'number') return { action: 'review' };
    const settings = await automationModel.getByJobId(job_id);
    if (!settings || !settings.ai_screening) return { action: 'review' };

    if (settings.auto_reject && score.overall_score <= settings.reject_threshold) {
      return { action: 'reject', threshold: settings.reject_threshold };
    }
    if (settings.auto_advance && score.overall_score >= settings.advance_threshold) {
      return { action: 'advance', threshold: settings.advance_threshold };
    }
    return { action: 'review' };
  }

  // -------- Rubric flow (the new AI Matching menu) --------

  validateRubric(rubric) {
    if (!rubric || typeof rubric !== 'object') {
      throw { status: 400, message: 'rubric is required' };
    }
    const fixed = rubric.fixed_criteria || {};
    const required = ['skills', 'experience', 'career_trajectory', 'education'];
    for (const key of required) {
      const w = Number(fixed[key]?.weight);
      if (!Number.isFinite(w) || w < 0 || w > 100) {
        throw { status: 400, message: `fixed_criteria.${key}.weight must be a number 0-100` };
      }
    }
    const customCriteria = Array.isArray(rubric.custom_criteria) ? rubric.custom_criteria : [];
    let total = required.reduce((s, k) => s + Number(fixed[k].weight), 0);
    for (const c of customCriteria) {
      const w = Number(c.weight);
      if (!c.description || typeof c.description !== 'string') {
        throw { status: 400, message: 'every custom_criteria entry needs a description string' };
      }
      if (!Number.isFinite(w) || w < 0 || w > 100) {
        throw { status: 400, message: 'custom_criteria weight must be a number 0-100' };
      }
      total += w;
    }
    if (Math.round(total) !== 100) {
      throw { status: 400, message: `weights must sum to 100 (got ${total})` };
    }
  }

  computeOverall(rubric, llmResult) {
    const fixed = rubric.fixed_criteria || {};
    const customCriteria = Array.isArray(rubric.custom_criteria) ? rubric.custom_criteria : [];

    let weightedSum =
      (llmResult.skills_score            || 0) * (Number(fixed.skills?.weight)            || 0) +
      (llmResult.experience_score        || 0) * (Number(fixed.experience?.weight)        || 0) +
      (llmResult.career_trajectory_score || 0) * (Number(fixed.career_trajectory?.weight) || 0) +
      (llmResult.education_score         || 0) * (Number(fixed.education?.weight)         || 0);

    const resultsByDescription = new Map(
      (llmResult.custom_criteria_results || []).map((r) => [r.description, r])
    );
    for (const c of customCriteria) {
      const r = resultsByDescription.get(c.description);
      const score = r ? Number(r.score) || 0 : 0;
      weightedSum += score * (Number(c.weight) || 0);
    }

    return Math.max(0, Math.min(100, Math.round(weightedSum / 100)));
  }

  async getRubric(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };
    return await screeningModel.getRubric(job_id);
  }

  async saveRubric(job_id, rubric) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };
    this.validateRubric(rubric);
    return await screeningModel.saveRubric(job_id, rubric);
  }

  async runMatching(job_id, { rubric: providedRubric, role_profile, context = {} } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    let rubric = providedRubric;
    if (rubric) {
      this.validateRubric(rubric);
      await screeningModel.saveRubric(job_id, rubric);
    } else {
      rubric = await screeningModel.getRubric(job_id);
      if (!rubric) {
        throw { status: 400, message: 'No rubric provided and no saved rubric exists for this job' };
      }
    }

    const roleProfile = role_profile === 'fresh_graduate' ? 'fresh_graduate' : 'experienced';

    const candidates = await screeningModel.getCandidatesByJob(job_id);
    const results = [];
    const errors = [];

    for (const c of candidates) {
      try {
        const applicant = await screeningModel.getApplicant(c.applicant_id);
        if (!applicant?.information) {
          errors.push({ applicant_id: c.applicant_id, message: 'No facets — run extract-facets first' });
          continue;
        }

        const aiContext = {
          ...context,
          metadata: { applicant_id: c.applicant_id, job_id, ...(context.metadata || {}) },
        };
        const llm = await aiService.scoreWithRubric(job, applicant.information, rubric, roleProfile, aiContext);
        const overall_score = this.computeOverall(rubric, llm);

        const stored = await screeningModel.upsertScore({
          applicant_id: c.applicant_id,
          job_id,
          overall_score,
          skills_score: llm.skills_score,
          experience_score: llm.experience_score,
          career_trajectory_score: llm.career_trajectory_score,
          education_score: llm.education_score,
          matched_skills: llm.matched_skills,
          missing_skills: llm.missing_skills,
          custom_criteria_results: llm.custom_criteria_results,
          rubric_snapshot: rubric,
          role_profile: roleProfile,
          summary: llm.summary,
        });
        results.push(stored);
      } catch (err) {
        errors.push({ applicant_id: c.applicant_id, message: err.message || String(err) });
      }
    }

    return { scored: results.length, total_candidates: candidates.length, errors, results };
  }

  async getMatchingResults(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };
    return await screeningModel.getResultsByJob(job_id);
  }

  // -------- end rubric flow --------

  async getResult(applicant_id, job_id) {
    if (!applicant_id || !job_id) {
      throw { status: 400, message: 'applicant_id and job_id are required' };
    }
    return await screeningModel.getByApplicantAndJob(applicant_id, job_id);
  }

  async search(params) {
    return await screeningModel.search(params);
  }
}

export default new ScreeningService();
