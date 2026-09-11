import getDb from '../../../config/postgres.js';

class CertificateModel {
  static async getByOnboarding(onboarding_id) {
    const result = await getDb().query(`
      SELECT id, phase_id, title, issued_at
      FROM onboarding_certificate
      WHERE onboarding_id = $1
      ORDER BY issued_at ASC
    `, [onboarding_id]);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      SELECT id, onboarding_id, phase_id, title, issued_at
      FROM onboarding_certificate
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  static async getByPhase(onboarding_id, phase_id) {
    const result = await getDb().query(`
      SELECT id FROM onboarding_certificate
      WHERE onboarding_id = $1 AND phase_id IS NOT DISTINCT FROM $2
    `, [onboarding_id, phase_id]);
    return result.rows[0] || null;
  }

  static async create({ onboarding_id, company_id, phase_id, title }) {
    const result = await getDb().query(`
      INSERT INTO onboarding_certificate (onboarding_id, company_id, phase_id, title)
      VALUES ($1, $2, $3, $4)
      RETURNING id, phase_id, title, issued_at
    `, [onboarding_id, company_id, phase_id, title]);
    return result.rows[0];
  }
}

export default CertificateModel;