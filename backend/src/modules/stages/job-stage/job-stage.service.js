import JobStageModel from "./job-stage.model.js";
import getDb from "../../../config/postgres.js";

class JobStageService {
  async getByJobId(jobId) {
    const jobStage = await JobStageModel.getByJobId(jobId);
    if (!jobStage) return { job_id: jobId, template_stage_id: null, template_name: null, is_custom: true, stages: [] };
    return jobStage;
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
      await JobStageModel.applyTemplate(jobId, templateId);
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

      await JobStageModel.saveCustomStages(jobId, stages);
    }

    return await JobStageModel.getByJobId(jobId);
  }
}

export default new JobStageService();
