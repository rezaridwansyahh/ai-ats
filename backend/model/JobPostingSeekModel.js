import db from '../db/connection.js';

class JobPostingSeek {
  static async getAll() {
    const result = await db.query(`
      SELECT *
      FROM mapping_job_posting_seek
      ORDER BY id ASC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_job_posting_seek
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByJobPostingId(job_posting_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_job_posting_seek
      WHERE job_posting_id = $1
    `, [job_posting_id]);
    return result.rows[0];
  }

  static async getDetailsByJobPostingId(job_posting_id) {
    const result = await db.query(`
      SELECT
        cjp.id AS job_posting_id,
        cjp.user_id,
        cjp.account_id,
        cjp.platform,
        cjp.job_title,
        cjp.job_desc,
        cjp.job_location,
        cjp.work_option,
        cjp.work_type,
        cjp.status,
        cjp.created_at,
        cjp.updated_at,
        mjps.id AS seek_id,
        mjps.currency,
        mjps.pay_type,
        mjps.pay_min,
        mjps.pay_max,
        mjps.pay_display
      FROM mapping_job_posting_seek mjps
      JOIN core_job_posting cjp ON mjps.job_posting_id = cjp.id
      WHERE mjps.job_posting_id = $1
    `, [job_posting_id]);
    return result.rows[0];
  }

  static async create(job_posting_id, currency, pay_type, pay_min, pay_max, pay_display) {
    const result = await db.query(`
      INSERT INTO mapping_job_posting_seek
        (job_posting_id, currency, pay_type, pay_min, pay_max, pay_display)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [job_posting_id, currency, pay_type, pay_min, pay_max, pay_display]);
    return result.rows[0];
  }

  static async update(job_posting_id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      throw new Error('No fields provided for update');
    }

    const setClause = keys
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(', ');

    const result = await db.query(`
      UPDATE mapping_job_posting_seek
      SET ${setClause}, updated_at = NOW()
      WHERE job_posting_id = $${keys.length + 1}
      RETURNING *
    `, [...values, job_posting_id]);
    return result.rows[0];
  }

  static async delete(job_posting_id) {
    const result = await db.query(`
      DELETE FROM mapping_job_posting_seek
      WHERE job_posting_id = $1
      RETURNING *
    `, [job_posting_id]);
    return result.rows[0];
  }
}

export default JobPostingSeek;