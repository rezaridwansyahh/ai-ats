import PipelineModel from "./pipeline.model.js";
import getDb from "../../config/postgres.js";

class PipelineService {
  async getByJobId(jobId) {
    const pipeline = await PipelineModel.getByJobId(jobId);
    if (!pipeline) return { job_id: jobId, template_stage_id: null, template_name: null, is_custom: true, stages: [] };
    return pipeline;
  }

  async saveStages(jobId, stages, templateId) {
    // Verify job exists
    const jobCheck = await getDb().query('SELECT id FROM core_job WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      throw { status: 404, message: 'Job not found' };
    }

    if (templateId !== undefined && templateId !== null) {
      // Template mode — verify template exists
      const tplCheck = await getDb().query('SELECT id FROM master_template_stage WHERE id = $1', [templateId]);
      if (tplCheck.rows.length === 0) {
        throw { status: 404, message: 'Template not found' };
      }
      await PipelineModel.applyTemplate(jobId, templateId);
    } else {
      // Custom mode — validate stages
      if (!Array.isArray(stages) || stages.length === 0) {
        throw { status: 400, message: 'At least one stage is required' };
      }

      const catResult = await getDb().query('SELECT id FROM recruitment_stage_category');
      const validCategoryIds = new Set(catResult.rows.map(r => r.id));

      for (const stage of stages) {
        if (!stage.name || !stage.name.trim()) {
          throw { status: 400, message: 'Stage name is required for all stages' };
        }
        if (!validCategoryIds.has(stage.stage_type_id)) {
          throw { status: 400, message: `Invalid stage category id: ${stage.stage_type_id}` };
        }
      }

      await PipelineModel.saveCustomStages(jobId, stages);
    }

    return await PipelineModel.getByJobId(jobId);
  }
}

export default new PipelineService();
