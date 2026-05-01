import CandidatePipeline from './candidate-pipeline.model.js';

class CandidatePipelineService {
  async getAll() {
    return await CandidatePipeline.getAll();
  }

  async getById(id) {
    const pipeline = await CandidatePipeline.getById(id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };
    return pipeline;
  }

  async getByJobId(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    return await CandidatePipeline.getByJobId(job_id);
  }

  async getByApplicantId(applicant_id) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    return await CandidatePipeline.getByApplicantId(applicant_id);
  }

  async create({ applicant_id, job_id }) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    try {
      const candidate = await CandidatePipeline.createFromApplicant(applicant_id, job_id);
      if (!candidate) {
        throw { status: 404, message: 'Applicant not found' };
      }
      return candidate;
    } catch (err) {
      if (err.code === '23505') {
        throw { status: 409, message: 'This applicant is already a candidate for this job' };
      }
      if (err.code === '23503') {
        throw { status: 400, message: 'Invalid applicant_id or job_id' };
      }
      throw err;
    }
  }

  async update(id, fields) {
    const pipeline = await CandidatePipeline.getById(id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };

    const allowed = {};
    if (fields.latest_stage !== undefined) allowed.latest_stage = fields.latest_stage;

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    return await CandidatePipeline.update(id, allowed);
  }

  async delete(id) {
    const pipeline = await CandidatePipeline.getById(id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };
    await CandidatePipeline.delete(id);
    return pipeline;
  }

  async getStages(pipeline_id) {
    const pipeline = await CandidatePipeline.getById(pipeline_id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };
    return await CandidatePipeline.getStages(pipeline_id);
  }

  async addStage(pipeline_id, { job_stage_id, decision }) {
    const pipeline = await CandidatePipeline.getById(pipeline_id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };

    if (!job_stage_id) throw { status: 400, message: 'job_stage_id is required' };
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
      throw { status: 400, message: 'decision must be a non-empty object' };
    }
    if (Object.keys(decision).length === 0) {
      throw { status: 400, message: 'decision must be a non-empty object' };
    }

    return await CandidatePipeline.addStage({ pipeline_id, job_stage_id, decision });
  }
}

export default new CandidatePipelineService();
