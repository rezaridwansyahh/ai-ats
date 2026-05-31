import getDb from '../../config/postgres.js';

// Candidate-facing data access for the Screening Q&A portal. The URL token is
// screening_qa.token; the candidate's identity (email to match at the gate) comes from
// screening_qa → candidate_screening → master_candidate → master_applicant.
class PortalQa {
  static async getByToken(token) {
    const result = await getDb().query(
      `
      SELECT sq.id,
             sq.token,
             sq.screening_id,
             sq.focus_area,
             sq.language,
             sq.num_questions,
             sq.questions,
             sq.answers,
             sq.status,
             sq.sent_at,
             sq.responded_at,
             sq.expired_at,
             mc.name  AS candidate_name,
             ma.email AS candidate_email,
             cj.job_title
      FROM screening_qa sq
      JOIN candidate_screening cs ON cs.id = sq.screening_id
      JOIN master_candidate mc    ON mc.id = cs.candidate_id
      JOIN core_job cj            ON cj.id = cs.job_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      WHERE sq.token::text = $1
         OR REPLACE(sq.token::text, '-', '') = $1
      LIMIT 1
      `,
      [token]
    );
    return result.rows[0] || null;
  }

  static async saveAnswers(id, answers) {
    const result = await getDb().query(
      `
      UPDATE screening_qa
      SET answers      = $2::jsonb,
          status       = 'responded',
          responded_at = NOW(),
          updated_at   = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, JSON.stringify(answers)]
    );
    return result.rows[0] || null;
  }
}

export default PortalQa;
