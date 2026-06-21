import getDb from '../../config/postgres.js';

class PortalAssessment {
  static async getByHash(hash) {
    const result = await getDb().query(
      `
      SELECT s.id,
             s.token,
             s.battery,
             s.candidate_id,
             s.job_id,
             s.status,
             s.expired_at,
             s.submitted_at,
             ma.email      AS candidate_email,
             mc.name       AS participant_name,
             ma.last_position    AS participant_position,
             mc.education  AS participant_education,
             j.job_title
      FROM assessment_sessions s
      LEFT JOIN master_candidate mc ON mc.id = s.candidate_id
      left join master_applicant ma on ma.id = mc.applicant_id 
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
