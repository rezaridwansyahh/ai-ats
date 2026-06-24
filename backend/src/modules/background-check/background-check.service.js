import backgroundCheckModel from './background-check.model.js';
import jobModel from '../job/job.model.js';

class BackgroundCheckService {
  async getWorkboard(company_id) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    return await backgroundCheckModel.getWorkboard(company_id);
  }

  async getByJob(job_id, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    if (company_id && job.company_id && job.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.getByJob(job_id);
  }

  async getById(bg_id, { company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const row = await backgroundCheckModel.getById(bg_id);
    if (!row) throw { status: 404, message: 'Background check record not found' };

    if (company_id && row.company_id && row.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return row;
  }

  async getByCandidateId(candidate_id, { company_id = null } = {}) {
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };

    const row = await backgroundCheckModel.getByCandidateId(candidate_id);

    if (company_id && row.company_id && row.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return row;
  }

  async updateStatus(bg_id, { status, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const valid = ['claims', 'consent', 'tracker', 'verdict', 'done', 'archived'];
    if (!valid.includes(status)) {
      throw { status: 400, message: `status must be one of: ${valid.join(', ')}` };
    }

    const existing = await backgroundCheckModel.getById(bg_id);
    if (!existing) throw { status: 404, message: 'Background check record not found' };

    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.updateStatus(bg_id, status);
  }

  async saveVerdict(bg_id, { verdict, verdict_note, decided_by, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const validVerdicts = ['pass', 'pass_with_concerns', 'fail'];
    if (!validVerdicts.includes(verdict)) {
      throw { status: 400, message: `verdict must be one of: ${validVerdicts.join(', ')}` };
    }

    // pass_with_concerns requires all three structured note fields
    if (verdict === 'pass_with_concerns') {
      if (!verdict_note?.gap || !verdict_note?.context || !verdict_note?.mitigation) {
        throw { status: 400, message: 'pass_with_concerns requires verdict_note with gap, context, and mitigation fields' };
      }
    }

    const existing = await backgroundCheckModel.getById(bg_id);
    if (!existing) throw { status: 404, message: 'Background check record not found' };

    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    // can only fire verdict when status is at verdict stage
    if (existing.status !== 'verdict') {
      throw { status: 400, message: 'Cannot save verdict — record is not at verdict stage' };
    }

    return await backgroundCheckModel.saveVerdict(bg_id, { verdict, verdict_note, decided_by });
  }

  async archive(bg_id, { archived_reason, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const validReasons = ['no_consent', 'consent_timeout', 'verdict_fail', 'calibration_advance'];
    if (!validReasons.includes(archived_reason)) {
      throw { status: 400, message: `archived_reason must be one of: ${validReasons.join(', ')}` };
    }

    const existing = await backgroundCheckModel.getById(bg_id);
    if (!existing) throw { status: 404, message: 'Background check record not found' };

    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.archive(bg_id, archived_reason);
  }

}

export default new BackgroundCheckService();