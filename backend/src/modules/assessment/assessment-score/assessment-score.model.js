import getDb from "../../../config/postgres.js"

class AssessmentScore {
  static async upsert({ result_id, subtest_id, score }) {
    const result = await getDb().query(`
      INSERT INTO assessment_score (result_id, subtest_id, score)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (result_id, subtest_id)
      DO UPDATE SET score = $3::jsonb, computed_at = NOW()
      RETURNING *
    `, [result_id, subtest_id, JSON.stringify(score)]);
    return result.rows[0];
  }

  static async getByResultId(result_id) {
    const result = await getDb().query(`
      SELECT * FROM assessment_score WHERE result_id = $1 ORDER BY computed_at ASC
    `, [result_id]);
    return result.rows;
  }
}

export default AssessmentScore;
