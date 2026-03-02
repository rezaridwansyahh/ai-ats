import db from "../../config/postgres.js"

class JobAccountModel {
  async getAll() {
    const result = await db.query(`
      SELECT *
      FROM master_job_account
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM master_job_account
      WHERE id = $1
    `, [id]);

    return result.rows[0];
  }

  async getByUserId(user_id) {
    const result = await db.query(`
      SELECT *
      FROM master_job_account
      WHERE user_id = $1
      ORDER BY id ASC
    `, [user_id]);

    return result.rows;
  }

  async getByUserIdAndPortal(user_id, portal_name) {
    const result = await db.query(`
      SELECT *
      FROM master_job_account
      WHERE user_id = $1 AND portal_name = $2
    `, [user_id, portal_name]);

    return result.rows[0];
  }

  async create(user_id, portal_name, email, password) {
    const result = await db.query(`
      INSERT INTO master_job_account (user_id, portal_name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user_id, portal_name, email, password]);

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
      UPDATE master_job_account
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(`
      DELETE FROM master_job_account
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }
}

export default new JobAccountModel();
