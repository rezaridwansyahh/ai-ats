import assessmentModel from './assessment.model.js';

class AssessmentService {
  async getWorkboard(company_id) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    return await assessmentModel.getWorkboardData(company_id);
  }

  async getByJobId(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    return await assessmentModel.getByJobId(job_id);
  }
}

export default new AssessmentService();
