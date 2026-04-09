import getDb from '../../config/postgres.js';

class AutomationModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM job_automation_settings
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getByJobId(jobId) {
    const result = await getDb().query(`
      SELECT *
      FROM job_automation_settings
      WHERE job_id = $1
    `, [jobId]);
    return result.rows[0];
  }

  async create(jobId, ai_screening, ai_follow_up, auto_schedule, auto_reject, auto_advance, email_notify, reject_threshold, advance_threshold) {
    const result = await getDb().query(`
      INSERT INTO job_automation_settings (job_id, ai_screening, ai_follow_up, auto_schedule, auto_reject, auto_advance, email_notify, reject_threshold, advance_threshold)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (job_id) DO UPDATE SET
        ai_screening = $2,
        ai_follow_up = $3,
        auto_schedule = $4,
        auto_reject = $5,
        auto_advance = $6,
        email_notify = $7,
        reject_threshold = $8,
        advance_threshold = $9,
        updated_at = NOW()
      RETURNING *
    `, [jobId, ai_screening, ai_follow_up, auto_schedule, auto_reject, auto_advance, email_notify, reject_threshold, advance_threshold]);
    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE job_automation_settings
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }
}

export default new AutomationModel();
