import applicantModel from './applicant.model.js';
import path from 'path';
import fs from 'fs';

class ApplicantService {
  async getAll() {
    return await applicantModel.getAll();
  }

  async getByJobSourcingId(job_sourcing_id) {
    return await applicantModel.getByJobSourcingId(job_sourcing_id);
  }

  async getById(id) {
    const applicant = await applicantModel.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    return applicant;
  }

  async getByJobId(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    return await Applicant.getByJobId(job_id);
  }

  async create(job_id, candidate_id, latest_stage, job_stage_id, decision) {
    if (!job_id || !candidate_id || latest_stage === undefined || latest_stage === null || !job_stage_id || !decision) {
      throw { status: 400, message: 'job_id, candidate_id, latest_stage, job_stage_id, and decision are required' };
    }
    return await Applicant.create({ job_id, candidate_id, latest_stage, job_stage_id, decision });
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
    const applicant = await applicantModel.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };

    return await applicantModel.delete(id);
  }

  async getCv(id) {
    const applicant = await applicantModel.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    if (!applicant.attachment) throw { status: 404, message: 'No CV available for this applicant' };

    const filePath = path.resolve(applicant.attachment);
    if (!fs.existsSync(filePath)) throw { status: 404, message: 'CV file not found on server' };

    return filePath;
  }
}

export default new ApplicantService();
