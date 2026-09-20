import getDb from '../../../config/postgres.js';

class OnboardingQuestion {
  static async getAllAssessments() {
    const result = await getDb().query(`
      SELECT id, assessment_code, name, milestone, duration_minutes, is_active
      FROM onboarding_assessment
      WHERE is_active = true
      ORDER BY id ASC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`SELECT * FROM onboarding_assessment WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async getByAssessmentCode(code) {
    const result = await getDb().query(`
      SELECT id, assessment_code, name, milestone, duration_minutes, options
      FROM onboarding_assessment
      WHERE assessment_code = $1
    `, [code]);
    return result.rows[0];
  }

  static async getQuestionsByCode(code) {
    const result = await getDb().query(`
      SELECT options->'questions' AS questions
      FROM onboarding_assessment
      WHERE assessment_code = $1
    `, [code]);
    return result.rows[0]?.questions ?? null;
  }
}

export default OnboardingQuestion;