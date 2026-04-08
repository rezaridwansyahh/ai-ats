import SlaModel from "./sla.model.js";
import getDb from "../../config/postgres.js";

class SlaService {
  async getByJobId(jobId) {
    const jobCheck = await getDb().query('SELECT id FROM core_job WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      throw { status: 404, message: 'Job not found' };
    }

    const slaRows = await SlaModel.getByJobId(jobId);
    const deadline = await SlaModel.getDeadline(jobId);

    return {
      job_id: Number(jobId),
      sla_deadline_days: deadline,
      stages: slaRows.map(r => ({
        stage_id: r.stage_id,
        sla_days: r.sla_days,
      })),
    };
  }

  async save(jobId, stages, deadlineDays) {
    const jobCheck = await getDb().query('SELECT id FROM core_job WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      throw { status: 404, message: 'Job not found' };
    }

    if (!Array.isArray(stages) || stages.length === 0) {
      throw { status: 400, message: 'At least one stage SLA entry is required' };
    }

    for (const s of stages) {
      if (!s.stage_id) {
        throw { status: 400, message: 'stage_id is required for all entries' };
      }
      if (s.sla_days === undefined || s.sla_days === null || s.sla_days < 1) {
        throw { status: 400, message: 'sla_days must be at least 1' };
      }
    }

    await SlaModel.deleteByJobId(jobId);
    for (const s of stages) {
      await SlaModel.upsert(jobId, s.stage_id, s.sla_days);
    }

    if (deadlineDays !== undefined && deadlineDays !== null) {
      await SlaModel.updateDeadline(jobId, deadlineDays);
    }

    return await this.getByJobId(jobId);
  }
}

export default new SlaService();
