import getDb from "../../../config/postgres.js"

class AssessmentAnswer {
  static async upsert({ result_id, question_id, answer, is_correct, score_earned }) {
    const result = await getDb().query(`
      INSERT INTO assessment_answer (result_id, question_id, answer, is_correct, score_earned)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      ON CONFLICT (result_id, question_id)
      DO UPDATE SET answer = $3::jsonb, is_correct = $4, score_earned = $5, answered_at = NOW()
      RETURNING *
    `, [result_id, question_id, JSON.stringify(answer), is_correct ?? null, score_earned ?? null]);
    return result.rows[0];
  }

  static async getByResultId(result_id) {
    const result = await getDb().query(`
      SELECT * FROM assessment_answer WHERE result_id = $1 ORDER BY answered_at ASC
    `, [result_id]);
    return result.rows;
  }
}

export default AssessmentAnswer;
