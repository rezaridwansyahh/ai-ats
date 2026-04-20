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
