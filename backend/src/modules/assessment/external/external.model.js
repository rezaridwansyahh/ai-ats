import getDb from "../../../config/postgres.js"

class ExternalAssessment {
  static async getById(id) {
    const result = await getDb().query(`
      SELECT * FROM candidate_external_assessment
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByCandidateJob(candidate_id, job_id) {
    const result = await getDb().query(`
      SELECT * FROM candidate_external_assessment
      WHERE candidate_id = $1 AND job_id = $2
    `, [candidate_id, job_id]);
    return result.rows[0];
  }

  static async getCandidateContext(candidate_id, job_id) {
    const result = await getDb().query(`
      SELECT
        mc.name       AS candidate_name,
        ma.email      AS candidate_email,
        cj.job_title,
        cj.company_id
      FROM master_candidate mc
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      LEFT JOIN core_job cj ON cj.id = $2
      WHERE mc.id = $1
    `, [candidate_id, job_id]);
    return result.rows[0] || null;
  }

  static async upsert({ candidate_id, job_id, company_id, assessment_url }) {
    const result = await getDb().query(`
      INSERT INTO candidate_external_assessment (candidate_id, job_id, company_id, assessment_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (candidate_id, job_id) DO UPDATE
        SET assessment_url = EXCLUDED.assessment_url, updated_at = NOW()
      RETURNING *
    `, [candidate_id, job_id, company_id, assessment_url]);
    return result.rows[0];
  }

  static async markSent(id, sent_by) {
    const result = await getDb().query(`
      UPDATE candidate_external_assessment
      SET status = 'sent', sent_at = NOW(), sent_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, sent_by]);
    return result.rows[0];
  }

  static async recordDecision(id, { decision, decided_by }) {
    const result = await getDb().query(`
      UPDATE candidate_external_assessment
      SET decision = $2, status = 'decided', decided_at = NOW(), decided_by = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, decision, decided_by]);
    return result.rows[0];
  }
}

export default ExternalAssessment;
