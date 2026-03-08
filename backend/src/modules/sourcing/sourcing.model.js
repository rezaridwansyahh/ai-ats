import db from "../../config/postgres.js"

class SourcingModel {
  async getAll() {
    const result = await db.query(`
      SELECT *
      FROM master_sourcing
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await db.query(`
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

    const result = await db.query(`
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

    const result = await db.query(`
      UPDATE master_sourcing
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(`
      DELETE FROM master_sourcing
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async getNextId() {
    const result = await db.query(`
      SELECT COALESCE(MAX(id), 0) + 1 AS next_id
      FROM master_sourcing
    `);
    return result.rows[0].next_id;
  }
}

export default new SourcingModel();
