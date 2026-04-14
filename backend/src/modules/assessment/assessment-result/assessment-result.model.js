import getDb from "../../../config/postgres.js"

const RESULT_SELECT = `
  SELECT ar.id,
         ar.participant_id,
         ar.instructor_id,
         ar.test_name,
         ar.date_test,
         ar.score,
         ar.created_at,
         ar.updated_at,
         p.name  AS participant_name,
         p.email AS participant_email,
         i.name  AS instructor_name,
         i.email AS instructor_email
  FROM assessment_results ar
  JOIN participants p ON p.id = ar.participant_id
  JOIN instructors  i ON i.id = ar.instructor_id
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

  static async getByInstructorId(instructor_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE ar.instructor_id = $1
      ORDER BY ar.created_at DESC
    `, [instructor_id]);
    return result.rows;
  }

  static async create({ participant_id, instructor_id, test_name, date_test, score }) {
    const result = await getDb().query(`
      INSERT INTO assessment_results (participant_id, instructor_id, test_name, date_test, score)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [participant_id, instructor_id, test_name, date_test, score]);
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
