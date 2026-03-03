import db from '../db/connection.js';

class JobPostingLinkedIn {
  static async getAll() {
    const result = await db.query(`
      SELECT *
      FROM mapping_job_posting_linkedin
      ORDER BY id ASC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_job_posting_linkedin
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByJobPostingId(job_posting_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_job_posting_linkedin
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
        mjpl.id AS linkedin_id
      FROM mapping_job_posting_linkedin mjpl
      JOIN core_job_posting cjp ON mjpl.job_posting_id = cjp.id
      WHERE mjpl.job_posting_id = $1
    `, [job_posting_id]);
    return result.rows[0];
  }

  static async create(job_posting_id) {
    const result = await db.query(`
      INSERT INTO mapping_job_posting_linkedin (job_posting_id)
      VALUES ($1)
      RETURNING *
    `, [job_posting_id]);
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
      UPDATE mapping_job_posting_linkedin
      SET ${setClause}, updated_at = NOW()
      WHERE job_posting_id = $${keys.length + 1}
      RETURNING *
    `, [...values, job_posting_id]);
    return result.rows[0];
  }

  static async delete(job_posting_id) {
    const result = await db.query(`
      DELETE FROM mapping_job_posting_linkedin
      WHERE job_posting_id = $1
      RETURNING *
    `, [job_posting_id]);
    return result.rows[0];
  }
}

export default JobPostingLinkedIn;