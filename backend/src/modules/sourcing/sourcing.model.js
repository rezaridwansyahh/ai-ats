import getDb from "../../config/postgres.js"

class SourcingModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM master_sourcing
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_sourcing
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async create(fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const result = await getDb().query(`
      INSERT INTO master_sourcing (${columns})
      VALUES (${placeholders})
      RETURNING *
    `, values);
    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(', ');

    const result = await getDb().query(`
      UPDATE master_sourcing
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  async updateStatus(id, status, error_message = null) {
    const result = await getDb().query(`
      UPDATE master_sourcing
      SET status = $1, error_message = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, error_message, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_sourcing
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async getNextId() {
    const result = await getDb().query(`
      SELECT COALESCE(MAX(id), 0) + 1 AS next_id
      FROM master_sourcing
    `);
    return result.rows[0].next_id;
  }

  // ─── CV Upload Batch ───

  async createBatch({ company_id, filename, file_type, total_files = 1 }) {
    const result = await getDb().query(`
      INSERT INTO cv_upload_batch (company_id, filename, file_type, status, total_files)
      VALUES ($1, $2, $3, 'Processing', $4)
      RETURNING *
    `, [company_id || null, filename, file_type, total_files]);
    return result.rows[0];
  }

  async updateBatch(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const result = await getDb().query(`
      UPDATE cv_upload_batch
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  async getBatchesByCompany(company_id, limit = 50) {
    const result = await getDb().query(`
      SELECT * FROM cv_upload_batch
      WHERE company_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [company_id, limit]);
    return result.rows;
  }

  static async bulkInsert(candidates) {
    if (!candidates.length) return;

    const values = [];
    const params = [];

    candidates.forEach((c, i) => {
      const offset = i * 3; // adjust based on column count
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      params.push(c.name, c.skill, c.email);
    });

    const sql = `INSERT INTO sourcing (name, skill, email) VALUES ${values.join(', ')} RETURNING *`;
    const result = await getDb().query(sql, params);
    return result.rows;
  }
}

export default new SourcingModel();
