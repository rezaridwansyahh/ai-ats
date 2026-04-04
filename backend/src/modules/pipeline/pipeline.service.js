import PipelineModel from "./pipeline.model.js";

const VALID_CATEGORIES = [
  'Job Management', 'Screening & Matching', 'Interview',
  'Assessment', 'Background Check', 'Offering & Contract', 'Other',
];

class PipelineService {
  async getByJobId(jobId) {
    const pipeline = await PipelineModel.getByJobId(jobId);
    if (!pipeline) return { pipeline_id: null, stages: [] };
    return pipeline;
  }

  async saveStages(jobId, stages) {
    if (!Array.isArray(stages) || stages.length === 0) {
      throw { status: 400, message: 'At least one stage is required' };
    }

    for (const stage of stages) {
      if (!stage.name || !stage.name.trim()) {
        throw { status: 400, message: 'Stage name is required for all stages' };
      }
      if (!VALID_CATEGORIES.includes(stage.category)) {
        throw { status: 400, message: `Invalid stage category: ${stage.category}` };
      }
    }

    let pipeline = await PipelineModel.getByJobId(jobId);
    let pipelineId;

    if (!pipeline) {
      try {
        const created = await PipelineModel.createPipeline(jobId);
        pipelineId = created.id;
      } catch (err) {
        if (err.code === '23503') {
          throw { status: 404, message: 'Job not found' };
        }
        throw err;
      }
    } else {
      pipelineId = pipeline.pipeline_id;
    }

    await PipelineModel.replaceStages(pipelineId, stages);

    return await PipelineModel.getByJobId(jobId);
  }
}

export default new PipelineService();
