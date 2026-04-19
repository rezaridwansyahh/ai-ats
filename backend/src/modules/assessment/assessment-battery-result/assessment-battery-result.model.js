import getDb from "../../../config/postgres.js"

class AssessmentBatteryResult {
  static async getAll() {
    const result = await getDb().query(`
      SELECT br.*,
            s.token, s.battery, s.status AS session_status,
            s.participant_id, s.job_id,
            p.name AS participant_name, p.email AS participant_email
      FROM assessment_battery_results br
      JOIN assessment_sessions s ON s.id = br.session_id
      LEFT JOIN participants p ON p.id = s.participant_id
      ORDER BY br.created_at DESC
    `);
    return result.rows;
  }

 static async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_battery_results
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByToken(token) {
    const result = await getDb().query(`
      SELECT br.*
      FROM assessment_battery_results br
      JOIN assessment_sessions s ON s.id = br.session_id
      WHERE s.token = $1
    `, [token]);
    return result.rows[0];
  }

  static async getBySessionId(session_id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_battery_results
      WHERE session_id = $1
    `, [session_id]);
    return result.rows[0];
  }

  static async saveReport(session_id, report) {
    const result = await getDb().query(`
      UPDATE assessment_battery_results
      SET report = $1, updated_at = NOW()
      WHERE session_id = $2
      RETURNING *
    `, [JSON.stringify(report), session_id]);
    return result.rows[0];
  }

  static async updateRecruiterReview(session_id, { recruiter_recommendation, recruiter_note, report }) {
    const result = await getDb().query(`
      UPDATE assessment_battery_results
      SET recruiter_recommendation = $1,
          recruiter_note = $2,
          report = COALESCE($3::jsonb, report),
          updated_at = NOW()
      WHERE session_id = $4
      RETURNING *
    `, [recruiter_recommendation || null, recruiter_note || null, report ? JSON.stringify(report) : null, session_id, ]);
    return result.rows[0];
  }

  static async create({ session_id, profile, result, scores }) {
    const res = await getDb().query(`
      INSERT INTO assessment_battery_results
        (session_id, profile, result, scores)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [session_id,JSON.stringify(profile),JSON.stringify(result),scores ? JSON.stringify(scores) : null,]);
    return res.rows[0];
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE assessment_battery_results
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM assessment_battery_results
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }  

}

export default AssessmentBatteryResult;