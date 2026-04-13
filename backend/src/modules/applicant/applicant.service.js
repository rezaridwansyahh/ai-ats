import Applicant from './applicant.model.js';

class ApplicantService {
  async getAll() {
    return await Applicant.getAll();
  }

  async getById(id) {
    const applicant = await Applicant.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    return applicant;
  }

  async getByJobId(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    return await Applicant.getByJobId(job_id);
  }

  async create({ job_id, candidate_id, latest_stage }) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };
    if (latest_stage === undefined || latest_stage === null) {
      throw { status: 400, message: 'latest_stage is required' };
    }
    return await Applicant.create({ job_id, candidate_id, latest_stage });
  }

  async update(id, fields) {
    const applicant = await Applicant.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };

    const allowed = {};
    if (fields.latest_stage !== undefined) allowed.latest_stage = fields.latest_stage;

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    return await Applicant.update(id, allowed);
  }

  async delete(id) {
    const applicant = await Applicant.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    await Applicant.delete(id);
    return applicant;
  }

  async getStages(applicant_id) {
    const applicant = await Applicant.getById(applicant_id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    return await Applicant.getStages(applicant_id);
  }

  async addStage(applicant_id, { job_stage_id, decision }) {
    const applicant = await Applicant.getById(applicant_id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };

    if (!job_stage_id) throw { status: 400, message: 'job_stage_id is required' };
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
      throw { status: 400, message: 'decision must be a non-empty object' };
    }
    if (Object.keys(decision).length === 0) {
      throw { status: 400, message: 'decision must be a non-empty object' };
    }

    return await Applicant.addStage({ applicant_id, job_stage_id, decision });
  }
}

export default new ApplicantService();
