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

  // order_index -> answer, scoped to one subtest — the exact shape the
  // server-side scoring registry needs (answersByOrderIndex).
  static async getByResultIdAndSubtestId(result_id, subtest_id) {
    const result = await getDb().query(`
      SELECT aq.order_index, aa.answer
      FROM assessment_answer aa
      JOIN assessment_question aq ON aq.id = aa.question_id
      WHERE aa.result_id = $1 AND aq.subtest_id = $2
    `, [result_id, subtest_id]);
    return result.rows;
  }

  // For the Q&A PDF export — each answer joined with its question's text/type
  // and subtest name, ordered for a natural read-through (subtest, then
  // question order within it).
  static async getByResultIdWithQuestions(result_id) {
    const result = await getDb().query(`
      SELECT
        aa.question_id,
        aa.answer,
        aa.is_correct,
        aa.score_earned,
        aa.answered_at,
        aq.question_type,
        aq.order_index  AS question_order,
        aq.content      AS question_content,
        ast.id          AS subtest_id,
        ast.name        AS subtest_name,
        ast.order_index AS subtest_order
      FROM assessment_answer aa
      JOIN assessment_question aq ON aq.id = aa.question_id
      JOIN assessment_subtest ast ON ast.id = aq.subtest_id
      WHERE aa.result_id = $1
      ORDER BY ast.order_index ASC, aq.order_index ASC
    `, [result_id]);
    return result.rows;
  }
}

export default AssessmentAnswer;
