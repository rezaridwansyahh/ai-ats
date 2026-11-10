import getDb from "../../config/postgres.js"

class JobAccountModel {
  async findById(account_id) {
    const account = await getDb().query(`
      SELECT *
      FROM master_job_account
      WHERE id = $1  
    `, [account_id]);

    return account.rows[0];
  }
  
  async findByUserId(user_id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_job_account
      WHERE user_id = $1
      ORDER BY id ASC
    `, [user_id]);

    return result.rows;
  }

  async create(user_id, portal_name, email, password, company_id = null) {
    const result = await getDb().query(`
      INSERT INTO master_job_account (user_id, portal_name, email, password, company_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, portal_name, email, password, company_id]);

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

    const result = await getDb().query(`
      UPDATE master_job_account
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_job_account
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }
}

export default new JobAccountModel();
