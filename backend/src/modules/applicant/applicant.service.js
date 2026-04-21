import applicantModel from './applicant.model.js';
import path from 'path';
import fs from 'fs';

class ApplicantService {
  async getAll() {
    return await applicantModel.getAll();
  }

  async getById(id) {
    const applicant = await applicantModel.getById(id);
    if (!applicant) throw { status: 404, message: 'Applicant not found' };
    return applicant;
  }

  async getByJobSourcingId(job_sourcing_id) {
    if (!job_sourcing_id) throw { status: 400, message: 'job_sourcing_id is required' };
    return await applicantModel.getByJobSourcingId(job_sourcing_id);
  }

  async create(payload) {
    const { job_sourcing_id, name, last_position, address } = payload;
    if (!job_sourcing_id || !name || !last_position || !address) {
      throw { status: 400, message: 'job_sourcing_id, name, last_position, and address are required' };
    }
    return await applicantModel.create(payload);
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
