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

  async create({ job_id, candidate_id, latest_stage }) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };
    if (latest_stage === undefined || latest_stage === null) {
      throw { status: 400, message: 'latest_stage is required' };
    }
    return await CandidatePipeline.create({ job_id, candidate_id, latest_stage });
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
