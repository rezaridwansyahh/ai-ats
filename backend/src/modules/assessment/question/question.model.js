import getDb from "../../../config/postgres.js"

class Question {
  static async getAllAssessments() {
    const result = await getDb().query(`
      SELECT id, assessment_code, name, description, duration_minutes, is_active
      FROM master_assessment
      WHERE is_active = true
      ORDER BY id ASC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_assessment
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByAssessmentCode(code) {
    const result = await getDb().query(`
      SELECT id, assessment_code, name, description, duration_minutes, options
      FROM master_assessment
      WHERE assessment_code = $1
    `, [code]);
    return result.rows[0];
  }

  // Questions now live in assessment_subtest/assessment_question (normalized
  // rows, independently editable) rather than master_assessment.options.questions
  // JSONB — that key was never actually populated. Grouped by subtest_key so
  // callers get the same "whole battery" shape as before, just DB-backed.
  static async getQuestionsByCode(code) {
    const result = await getDb().query(`
      SELECT s.id AS subtest_id, s.subtest_key, s.group_key, s.name, s.weight,
             s.time_limit_seconds, s.order_index AS subtest_order,
             q.id AS question_id, q.question_type, q.order_index AS question_order, q.content
      FROM master_assessment ma
      JOIN assessment_subtest s ON s.assessment_id = ma.id
      JOIN assessment_question q ON q.subtest_id = s.id AND q.is_active = true
      WHERE ma.assessment_code = $1
      ORDER BY s.order_index, q.order_index
    `, [code]);
    if (result.rows.length === 0) return null;

    const bySubtest = {};
    for (const row of result.rows) {
      if (!bySubtest[row.subtest_key]) {
        bySubtest[row.subtest_key] = {
          subtest: {
            id: row.subtest_id, subtest_key: row.subtest_key, group_key: row.group_key,
            name: row.name, weight: row.weight, time_limit_seconds: row.time_limit_seconds,
            order_index: row.subtest_order,
          },
          items: [],
        };
      }
      bySubtest[row.subtest_key].items.push({
        id: row.question_id, question_type: row.question_type,
        order_index: row.question_order, content: row.content,
      });
    }
    return bySubtest;
  }

  static async getSubtestByCode(code, subtest) {
    const subtestRes = await getDb().query(`
      SELECT s.id, s.subtest_key, s.group_key, s.name, s.weight, s.time_limit_seconds, s.order_index
      FROM master_assessment ma
      JOIN assessment_subtest s ON s.assessment_id = ma.id
      WHERE ma.assessment_code = $1 AND s.subtest_key = $2
    `, [code, subtest]);
    if (!subtestRes.rows[0]) return null;
    const subtestRow = subtestRes.rows[0];

    const allSubtestsRes = await getDb().query(`
      SELECT s.subtest_key
      FROM master_assessment ma
      JOIN assessment_subtest s ON s.assessment_id = ma.id
      WHERE ma.assessment_code = $1
      ORDER BY s.order_index
    `, [code]);

    const itemsRes = await getDb().query(`
      SELECT id, question_type, order_index, content
      FROM assessment_question
      WHERE subtest_id = $1 AND is_active = true
      ORDER BY order_index
    `, [subtestRow.id]);

    return {
      subtest: subtestRow,
      subtests: allSubtestsRes.rows.map((r) => r.subtest_key),
      items: itemsRes.rows,
    };
  }
}

export default Question;
