import getDb from "../../../config/postgres.js"

class Question {
  static async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_questions
      ORDER BY id ASC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_questions
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create({ text, options, correct, points }) {
    const result = await getDb().query(`
      INSERT INTO assessment_questions (text, options, correct, points)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [text, JSON.stringify(options), correct, points]);
    return result.rows[0];
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE assessment_questions
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM assessment_questions
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default Question;
