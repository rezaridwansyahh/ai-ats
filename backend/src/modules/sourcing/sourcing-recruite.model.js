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

  async create(id, sourcing_id, name, skill, information) {
    const result = await db.query(`
      INSERT INTO master_sourcing_recruite (id, sourcing_id, name, skill, information)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, sourcing_id, name, skill, information ? JSON.stringify(information) : null]);
    return result.rows[0];
  }

  async bulkCreate(sourcing_id, recruites) {
    if (!recruites.length) return [];

    const nextId = await this.getNextId();
    const values = [];
    const params = [];

    recruites.forEach((r, i) => {
      const offset = i * 5;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
      params.push(nextId + i, sourcing_id, r.name, r.skill, r.information ? JSON.stringify(r.information) : null);
    });

    const result = await db.query(`
      INSERT INTO master_sourcing_recruite (id, sourcing_id, name, skill, information)
      VALUES ${values.join(', ')}
      RETURNING *
    `, params);
    return result.rows;
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
