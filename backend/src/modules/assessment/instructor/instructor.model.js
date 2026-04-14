import getDb from "../../../config/postgres.js"

class Instructor {
  static async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM instructors
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM instructors
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByEmail(email) {
    const result = await getDb().query(`
      SELECT *
      FROM instructors
      WHERE email = $1
    `, [email]);
    return result.rows[0];
  }

  static async create({ name, email, position, department }) {
    const result = await getDb().query(`
      INSERT INTO instructors (name, email, position, department)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, email, position, department]);
    return result.rows[0];
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE instructors
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM instructors
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default Instructor;
