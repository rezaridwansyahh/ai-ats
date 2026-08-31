import getDb from '../../config/postgres.js';

const RESULT_SELECT = `
  SELECT oar.id,
         oar.candidate_onboarding_id,
         oar.assessment_id,
         oar.status,
         oar.results,
         oar.summary,
         oar.started_at,
         oar.completed_at,
         oar.created_at,
         oar.updated_at,
         co.candidate_name,
         co.position_title
  FROM onboarding_assessment_result oar
  JOIN candidate_onboarding co ON co.id = oar.candidate_onboarding_id
`;

class OnboardingAssessmentResultModel {
  static async getByOnboardingId(candidate_onboarding_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE oar.candidate_onboarding_id = $1
      ORDER BY oar.assessment_id, oar.created_at DESC
    `, [candidate_onboarding_id]);
    return result.rows;
  }

  static async getLatestByOnboardingAssessment(candidate_onboarding_id, assessment_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE oar.candidate_onboarding_id = $1
        AND oar.assessment_id = $2
      ORDER BY oar.created_at DESC
      LIMIT 1
    `, [candidate_onboarding_id, assessment_id]);
    return result.rows[0];
  }

  static async getForUpdate(client, candidate_onboarding_id, assessment_id) {
    const res = await client.query(`
      SELECT * FROM onboarding_assessment_result
      WHERE candidate_onboarding_id = $1 AND assessment_id = $2
      FOR UPDATE
    `, [candidate_onboarding_id, assessment_id]);
    return res.rows[0];
  }

  static async create(client, { candidate_onboarding_id, assessment_id, status, results, summary, started_at, completed_at }) {
    const res = await client.query(`
      INSERT INTO onboarding_assessment_result
        (candidate_onboarding_id, assessment_id, status, results, summary, started_at, completed_at)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
      RETURNING *
    `, [
      candidate_onboarding_id,
      assessment_id,
      status,
      JSON.stringify(results),
      summary ? JSON.stringify(summary) : null,
      started_at || null,
      completed_at || null,
    ]);
    return res.rows[0];
  }

  static async update(client, id, fields) {
    const JSONB_FIELDS = new Set(['results', 'summary']);
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;

    const setClause = keys
      .map((k, i) => JSONB_FIELDS.has(k) ? `${k} = $${i + 1}::jsonb` : `${k} = $${i + 1}`)
      .join(', ');
    const values = keys.map((k) => {
      const v = fields[k];
      if (JSONB_FIELDS.has(k)) return v == null ? null : JSON.stringify(v);
      return v ?? null;
    });

    const res = await client.query(`
      UPDATE onboarding_assessment_result
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return res.rows[0];
  }
}

export default OnboardingAssessmentResultModel;