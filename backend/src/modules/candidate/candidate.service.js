import candidateModel from './candidate.model.js';
import path from 'path';
import fs from 'fs';

const VALID_STATUSES = ['Kotak masuk', 'Prescreen', 'Terpilih', 'Wawancara', 'Penawaran', 'Menerima Tawaran', 'Tidak cocok'];

class CandidateService {
  async getAll() {
    return await candidateModel.getAll();
  }

  async getByJobPostingId(job_posting_id) {
    const candidates = await candidateModel.getByJobPostingId(job_posting_id);
    return candidates;
  }

  async getById(id) {
    const candidate = await candidateModel.getById(id);
    if (!candidate) throw { status: 404, message: 'Candidate not found' };
    return candidate;
  }

  async updateStatus(id, status) {
    if (!status) throw { status: 400, message: 'status is required' };
    if (!VALID_STATUSES.includes(status)) {
      throw { status: 400, message: `status must be one of: ${VALID_STATUSES.join(', ')}` };
    }

    const candidate = await candidateModel.getById(id);
    if (!candidate) throw { status: 404, message: 'Candidate not found' };

    return await candidateModel.updateStatus(id, status);
  }

  async delete(id) {
    const candidate = await candidateModel.getById(id);
    if (!candidate) throw { status: 404, message: 'Candidate not found' };

    return await candidateModel.delete(id);
  }

  async getCv(id) {
    const candidate = await candidateModel.getById(id);
    if (!candidate) throw { status: 404, message: 'Candidate not found' };
    if (!candidate.attachment) throw { status: 404, message: 'No CV available for this candidate' };

    const filePath = path.resolve(candidate.attachment);
    if (!fs.existsSync(filePath)) throw { status: 404, message: 'CV file not found on server' };

    return filePath;
  }
}

export default new CandidateService();
