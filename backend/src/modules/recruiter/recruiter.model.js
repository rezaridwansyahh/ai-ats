import getDb from "../../config/postgres.js"

class RecruiterModel {
  async getAllByCompanyId(company_id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_recruiters
      WHERE company_id = $1
      ORDER BY id ASC
    `, [company_id]);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_recruiters
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async create(name, email, jobs_assigned, status, company_id) {
    const result = await getDb().query(`
      INSERT INTO master_recruiters (name, email, jobs_assigned, status, company_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, jobs_assigned, status, company_id ?? null]);
    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE master_recruiters
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_recruiters
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default new RecruiterModel();
