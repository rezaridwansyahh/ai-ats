import db from "../../config/postgres.js"

class JobPostModel {
  async getAll() {
    const result = await db.query(`
      SELECT *
      FROM core_job_posting
      ORDER BY id ASC
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM core_job_posting
      WHERE id = $1
    `, [id]);

    return result.rows[0];
  }

  async getByAccountId(account_id) {
    const result = await db.query(`
      SELECT *
      FROM core_job_posting
      WHERE account_id = $1
      ORDER BY created_at DESC
    `, [account_id]);

    return result.rows;
  }

  async getByUserId(user_id) {
    const result = await db.query(`
      SELECT cjp.*
      FROM core_job_posting cjp
      JOIN master_job_account mja ON cjp.account_id = mja.id
      WHERE mja.user_id = $1
      ORDER BY cjp.created_at DESC
    `, [user_id]);

    return result.rows;
  }

  async getByUserIdAndStatus(user_id, status) {
    const result = await db.query(`
      SELECT cjp.*
      FROM core_job_posting cjp
      JOIN master_job_account mja ON cjp.account_id = mja.id
      WHERE mja.user_id = $1 AND cjp.status = $2
      ORDER BY cjp.created_at DESC
    `, [user_id, status]);

    return result.rows;
  }

  async getByPlatform(platform) {
    const result = await db.query(`
      SELECT *
      FROM core_job_posting
      WHERE platform = $1
      ORDER BY created_at DESC
    `, [platform]);

    return result.rows;
  }

  async create(account_id, platform, job_title, job_desc, job_location, work_option, work_type, status = 'Running', candidate_count, additional) {
    const result = await db.query(`
      INSERT INTO core_job_posting
        (account_id, platform, job_title, job_desc, job_location, work_option, work_type, status, candidate_count, additional)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [account_id, platform, job_title, job_desc, job_location, work_option, work_type, status, candidate_count, additional]);

    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      throw new Error('No fields provided for update');
    }

    const setClause = keys
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(', ');

    const result = await db.query(`
      UPDATE core_job_posting
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await db.query(`
      UPDATE core_job_posting
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(`
      DELETE FROM core_job_posting
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }
}

export default new JobPostModel();
