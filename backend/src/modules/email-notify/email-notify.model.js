import db from '../../config/postgres.js';

class EmailNotify {
  async getAll() {
    const result = await db.query(`
      SELECT * FROM master_email_notify
      ORDER BY created_at DESC
    `)

    return result.rows
  }

  async getById(id) {
    const result = await db.query(`
      SELECT * FROM master_email_notify WHERE id = $1
    `, [id])
    return result.rows[0]
  }

  async getActive() {
    const result = await db.query(`
      SELECT email FROM master_email_notify
      WHERE is_active = TRUE
    `)
    return result.rows.map(r => r.email)
  }

  async create(email, label) {
    const result = await db.query(`
      INSERT INTO master_email_notify (email, label)
      VALUES ($1, $2)
      RETURNING *
      `, [email, label]);
    return result.rows[0]
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
      UPDATE master_email_notify
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(`
      DELETE FROM master_email_notify WHERE id = $1 RETURNING *
    `, [id])
    return result.rows[0]
  }

}

export default new EmailNotify();