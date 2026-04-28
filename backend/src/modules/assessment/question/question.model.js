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

  static async getQuestionsByCode(code) {
    const result = await getDb().query(`
      SELECT options->'questions' AS questions
      FROM master_assessment
      WHERE assessment_code = $1
    `, [code]);
    return result.rows[0]?.questions ?? null;
  }

  static async getSubtestByCode(code, subtest) {
    const result = await getDb().query(`
      SELECT options->'questions'->$2 AS items,
             options->'subtests'      AS subtests
      FROM master_assessment
      WHERE assessment_code = $1
    `, [code, subtest]);
    return result.rows[0] ?? null;
  }
}

export default Question;
