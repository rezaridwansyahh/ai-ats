import getDb from "../../../config/postgres.js"

class Session {
  static async getAll({ status, battery, job_id } = {}) {
    const conds = []; const params = [];
    if (status)  { conds.push(`s.status = $${params.length + 1}`);  params.push(status); }
    if (battery) { conds.push(`s.battery = $${params.length + 1}`); params.push(battery); }
    if (job_id)  { conds.push(`s.job_id = $${params.length + 1}`);  params.push(job_id); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions s
      ${where}
      ORDER BY s.created_at DESC
    `, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByParticipantId(participant_id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions
      WHERE participant_id = $1
    `, [participant_id]);
    return result.rows;
  }

  static async getByJobId(job_id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions
      WHERE job_id = $1
    `, [job_id]);
    return result.rows;
  }  

  // All non-expired sessions for (participant, job). Includes 'completed' so the
  // recruiter UI can surface past submissions, not just live invitations.
  static async getActiveByParticipantJob(participant_id, job_id) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions
      WHERE participant_id = $1
        AND job_id IS NOT DISTINCT FROM $2
        AND status <> 'expired'
      ORDER BY created_at DESC
    `, [participant_id, job_id]);
    return result.rows;
  }

  static async getByParticipantJobBattery(participant_id, job_id, battery) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions
      WHERE participant_id = $1
        AND job_id IS NOT DISTINCT FROM $2
        AND battery = $3
        AND status IN ('invited', 'in_progress')
      ORDER BY created_at DESC
      LIMIT 1
    `, [participant_id, job_id, battery]);
    return result.rows[0];
  }

  static async getByToken(token) {
    const result = await getDb().query(`
      SELECT *
      FROM assessment_sessions
      WHERE token = $1
    `, [token]);
    return result.rows[0];
  }  

  static async markCompleted(id) {
    const result = await getDb().query(`
      UPDATE assessment_sessions
      SET status = 'completed', submitted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  static async create({ battery, participant_id, job_id, created_by, expired_at, notes }) {
    const result = await getDb().query(`
      INSERT INTO assessment_sessions
        (battery, participant_id, job_id, created_by, expired_at, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [battery, participant_id || null, job_id || null, created_by, expired_at, notes || null]);
    return result.rows[0];
  }


  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE assessment_sessions
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM assessment_sessions
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default Session;
