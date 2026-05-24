import getDb from '../../config/postgres.js';

class PortalAssessment {
  static async getByHash(hash) {
    const result = await getDb().query(
      `
      SELECT s.id,
             s.token,
             s.battery,
             s.participant_id,
             s.job_id,
             s.status,
             s.expired_at,
             s.submitted_at,
             p.email      AS participant_email,
             p.name       AS participant_name,
             p.position   AS participant_position,
             p.department AS participant_department,
             p.education  AS participant_education,
             p.date_birth AS participant_date_birth,
             j.job_title
      FROM assessment_sessions s
      LEFT JOIN participants p ON p.id = s.participant_id
      LEFT JOIN core_job      j ON j.id = s.job_id
      WHERE s.token::text = $1
         OR REPLACE(s.token::text, '-', '') = $1
      LIMIT 1
      `,
      [hash]
    );
    return result.rows[0] || null;
  }
}

export default PortalAssessment;
