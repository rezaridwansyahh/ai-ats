import getDb from "../../../config/postgres.js"

const RESULT_SELECT = `
  SELECT caa.id,
         caa.participant_id,
         caa.assessment_id,
         caa.status,
         caa.results,
         caa.summary,
         caa.narrative_report,
         caa.strengths,
         caa.development_areas,
         caa.recommended_roles,
         caa.started_at,
         caa.completed_at,
         caa.assessment_date,
         caa.created_at,
         caa.updated_at,
         p.name        AS participant_name,
         p.email       AS participant_email,
         p.position    AS participant_position,
         p.department  AS participant_department,
         p.education   AS participant_education,
         p.date_birth  AS participant_date_birth,
         ma.assessment_code,
         ma.name AS assessment_name
  FROM core_applicant_assessment caa
  JOIN participants p          ON p.id  = caa.participant_id
  LEFT JOIN master_assessment ma ON ma.id = caa.assessment_id
`;

class AssessmentBatteryResult {
  static async getAll() {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      ORDER BY caa.created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE caa.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByParticipantId(participant_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE caa.participant_id = $1
      ORDER BY caa.assessment_date DESC, caa.created_at DESC
    `, [participant_id]);
    return result.rows;
  }

  static async getByParticipantAndAssessment(participant_id, assessment_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE caa.participant_id = $1
        AND caa.assessment_id  = $2
      ORDER BY caa.assessment_date DESC
      LIMIT 1
    `, [participant_id, assessment_id]);
    return result.rows[0];
  }

  static async getLatestByParticipantAssessment(participant_id, assessment_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE caa.participant_id = $1
        AND caa.assessment_id  = $2
      ORDER BY caa.created_at DESC
      LIMIT 1
    `, [participant_id, assessment_id]);
    return result.rows[0];
  }

  static async getActiveByParticipantAssessment(participant_id, assessment_id) {
    const result = await getDb().query(`
      ${RESULT_SELECT}
      WHERE caa.participant_id = $1
        AND caa.assessment_id  = $2
      LIMIT 1
    `, [participant_id, assessment_id]);
    return result.rows[0];
  }

  static async getForUpdate(client, participant_id, assessment_id) {
    const res = await client.query(`
      SELECT * FROM core_applicant_assessment
      WHERE participant_id = $1 AND assessment_id = $2
      FOR UPDATE
    `, [participant_id, assessment_id]);
    return res.rows[0];
  }

  static async create(client, { participant_id, assessment_id, status, results, summary, started_at, completed_at }) {
    const res = await client.query(`
      INSERT INTO core_applicant_assessment
        (participant_id, assessment_id, status, results, summary, started_at, completed_at)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
      RETURNING *
    `, [
      participant_id,
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
      UPDATE core_applicant_assessment
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return res.rows[0];
  }

  static async updateReport(id, { summary, narrative_report, strengths, development_areas, recommended_roles }) {
    const result = await getDb().query(`
      UPDATE core_applicant_assessment
      SET summary            = COALESCE($1::jsonb, summary),
          narrative_report   = COALESCE($2, narrative_report),
          strengths          = COALESCE($3, strengths),
          development_areas  = COALESCE($4, development_areas),
          recommended_roles  = COALESCE($5, recommended_roles),
          updated_at         = NOW()
      WHERE id = $6
      RETURNING *
    `, [
      summary ? JSON.stringify(summary) : null,
      narrative_report ?? null,
      strengths ?? null,
      development_areas ?? null,
      recommended_roles ?? null,
      id,
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM core_applicant_assessment
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default AssessmentBatteryResult;
