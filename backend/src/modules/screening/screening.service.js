import screeningModel from './screening.model.js';
import jobModel from '../job/job.model.js';
import automationModel from '../automation-setting/automation.model.js';
import aiService from '../../shared/services/ai.service.js';
import { parseFileToText } from '../../shared/utils/file-parser.js';

class ScreeningService {
  // Layer 1 — extract facets from a CV file (multer file object).
  async extractFacetsFromFile(applicant_id, file) {
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

    return this._extractAndStore(applicant_id, cvText);
  }

  // Layer 1 — extract facets from raw text (useful when CV text is already available).
  async extractFacetsFromText(applicant_id, cvText) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    if (!cvText || typeof cvText !== 'string' || !cvText.trim()) {
      throw { status: 400, message: 'cv_text is required' };
    }
    const applicant = await screeningModel.getApplicant(applicant_id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };

    return this._extractAndStore(applicant_id, cvText);
  }

  async _extractAndStore(applicant_id, cvText) {
    const facets = await aiService.extractFacets(cvText);
    const updated = await screeningModel.setApplicantInformation(applicant_id, facets);
    return { applicant: updated, facets };
  }

  // Layer 2 — score one applicant against one job.
  async scoreApplicantForJob(applicant_id, job_id) {
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

    const score = await aiService.scoreApplicantAgainstJob(job, applicant.information);
    const stored = await screeningModel.upsertScore({
      applicant_id,
      job_id,
      ...score,
    });
    return stored;
  }

  // Bulk re-score every candidate already in the pipeline for this job.
  async scoreBulkForJob(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    const candidates = await screeningModel.getCandidatesByJob(job_id);
    const results = [];
    const errors = [];

    for (const c of candidates) {
      try {
        const stored = await this.scoreApplicantForJob(c.applicant_id, job_id);
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
