import Sla from "./sla.model.js";

class SlaService {
  async getByJobId(jobId) {
    const slaRows = await Sla.getByJobId(jobId);
    const deadline = await Sla.getDeadline(jobId);

    return {
      job_id: Number(jobId),
      sla_deadline_days: deadline,
      stages: slaRows.map(r => ({
        stage_id: r.stage_id,
        sla_days: r.sla_days,
      })),
    };
  }

  async create(jobId, { stages, sla_deadline_days }) {
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

    await Sla.deleteByJobId(jobId);
    for (const s of stages) {
      await Sla.upsert(jobId, s.stage_id, s.sla_days);
    }

    if (sla_deadline_days !== undefined && sla_deadline_days !== null) {
      await Sla.updateDeadline(jobId, sla_deadline_days);
    }

    return await this.getByJobId(jobId);
  }
}

export default new SlaService();
