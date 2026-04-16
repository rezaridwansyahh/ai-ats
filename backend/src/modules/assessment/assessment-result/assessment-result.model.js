import getDb from "../../../config/postgres.js"

const RESULT_SELECT = `
  SELECT ar.id,
         ar.participant_id,
         ar.score,
         ar.answers,
         ar.created_at,
         ar.updated_at,
         p.name  AS participant_name,
         p.email AS participant_email
  FROM assessment_results ar
  JOIN participants p ON p.id = ar.participant_id
`;

class AssessmentResult {
  static async getAll() {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      ORDER BY ar.created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE ar.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByParticipantId(participant_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE ar.participant_id = $1
    `, [participant_id]);
    return result.rows[0];
  }

  static async create({ participant_id, score, answers }) {
    const result = await getDb().query(`
      INSERT INTO assessment_results (participant_id, score, answers)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [participant_id, score, JSON.stringify(answers)]);
    return result.rows[0];
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE assessment_results
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM assessment_results
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default AssessmentResult;
