import getDb from "../../config/postgres.js";

class SlaModel {
  async getByJobId(jobId) {
    const result = await getDb().query(`
      SELECT jss.id, jss.job_id, jss.stage_id, jss.sla_days,
             jss.created_at, jss.updated_at
      FROM job_stage_sla jss
      WHERE jss.job_id = $1
      ORDER BY jss.id ASC
    `, [jobId]);
    return result.rows;
  }

  async upsert(jobId, stageId, slaDays) {
    const result = await getDb().query(`
      INSERT INTO job_stage_sla (job_id, stage_id, sla_days)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id, stage_id)
      DO UPDATE SET sla_days = $3, updated_at = NOW()
      RETURNING *
    `, [jobId, stageId, slaDays]);
    return result.rows[0];
  }

  async deleteByJobId(jobId) {
    await getDb().query(
      `DELETE FROM job_stage_sla 
      WHERE job_id = $1
      RETURNING *
      `,
      [jobId]
    );
  }

  async updateDeadline(jobId, deadlineDays) {
    const result = await getDb().query(`
      UPDATE core_job
      SET sla_deadline_days = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, sla_deadline_days
    `, [deadlineDays, jobId]);
    return result.rows[0];
  }

  async getDeadline(jobId) {
    const result = await getDb().query(`
      SELECT sla_deadline_days 
      FROM core_job 
      WHERE id = $1
    `, [jobId]);
    return result.rows[0]?.sla_deadline_days ?? null;
  }
}

export default new SlaModel();
