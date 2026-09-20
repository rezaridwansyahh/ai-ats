import getDb from '../../config/postgres.js';

class PortalOnboardingModel {

  static async getByEmail(email) {
    const result = await getDb().query(`
      SELECT
        co.id            AS onboarding_id,
        co.candidate_id,
        co.job_id,
        co.company_id,
        co.candidate_name,
        co.position_title,
        co.start_date,
        co.current_stage,
        co.onboarding_status,
        co.created_at,
        ma.email         AS candidate_email
      FROM master_applicant ma
      JOIN master_candidate mc     ON mc.applicant_id = ma.id
      JOIN candidate_onboarding co ON co.candidate_id = mc.id
      WHERE LOWER(ma.email) = $1
      ORDER BY co.created_at DESC
      LIMIT 1
    `, [email]);

    return result.rows[0] || null;
  }

  static async getById(onboarding_id) {
    const result = await getDb().query(`
      SELECT
        co.id AS onboarding_id,
        co.candidate_id,
        co.job_id,
        co.company_id,
        co.candidate_name,
        co.position_title,
        co.start_date,
        co.current_stage,
        co.onboarding_status
      FROM candidate_onboarding co
      WHERE co.id = $1
    `, [onboarding_id]);

    return result.rows[0] || null;
  }
}

export default PortalOnboardingModel;