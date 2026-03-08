import db from "../../config/postgres.js"

class SourcingRecruiteModel {
  async getBySourcingId(sourcing_id) {
    const result = await db.query(`
      SELECT *
      FROM master_sourcing_recruite
      WHERE sourcing_id = $1
      ORDER BY date_created DESC
    `, [sourcing_id]);
    return result.rows;
  }

  async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM master_sourcing_recruite
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async create(id, sourcing_id, job_title, information) {
    const result = await db.query(`
      INSERT INTO master_sourcing_recruite (id, sourcing_id, job_title, information)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, sourcing_id, job_title, information || null]);
    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(', ');

    const result = await db.query(`
      UPDATE master_sourcing_recruite
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(`
      DELETE FROM master_sourcing_recruite
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async deleteBySourcingId(sourcing_id) {
    const result = await db.query(`
      DELETE FROM master_sourcing_recruite
      WHERE sourcing_id = $1
      RETURNING *
    `, [sourcing_id]);
    return result.rows;
  }

  async getNextId() {
    const result = await db.query(`
      SELECT COALESCE(MAX(id), 0) + 1 AS next_id
      FROM master_sourcing_recruite
    `);
    return result.rows[0].next_id;
  }
}

export default new SourcingRecruiteModel();
