import getDb from "../../config/postgres.js"

const CANDIDATE_PIPELINE_SELECT = `
  SELECT c.id,
         c.job_id,
         c.name AS candidate_name,
         c.last_position,
         c.address,
         c.education,
         c.information,
         c.date,
         c.attachment,
         c.latest_stage,
         c.created_at,
         c.updated_at,
         COALESCE(js.name, 'Not Started') AS latest_stage_name
  FROM master_candidate c
  LEFT JOIN job_stage js ON js.id = c.latest_stage
`;

class CandidatePipeline {
  static async getAll() {
    const result = await getDb().query(`
      ${CANDIDATE_PIPELINE_SELECT}
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      ${CANDIDATE_PIPELINE_SELECT}
      WHERE c.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByJobId(job_id) {
    const result = await getDb().query(`
      ${CANDIDATE_PIPELINE_SELECT}
      WHERE c.job_id = $1
      ORDER BY c.created_at DESC
    `, [job_id]);
    return result.rows;
  }

  static async getByApplicantId(applicant_id) {
    const result = await getDb().query(`
      SELECT c.id, c.job_id, c.applicant_id, c.latest_stage, c.created_at,
             j.job_title, j.status AS job_status
      FROM master_candidate c
      JOIN core_job j ON j.id = c.job_id
      WHERE c.applicant_id = $1
      ORDER BY c.created_at DESC
    `, [applicant_id]);
    return result.rows;
  }

  static async createFromApplicant(applicant_id, job_id) {
    const result = await getDb().query(`
      INSERT INTO master_candidate (
        job_id, applicant_id, name, last_position, address,
        education, information, date, attachment
      )
      SELECT $1, a.id, a.name, a.last_position, a.address,
             a.education, a.information, a.date, a.attachment
      FROM master_applicant a
      WHERE a.id = $2
      RETURNING *
    `, [job_id, applicant_id]);
    return result.rows[0];
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE master_candidate
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_candidate
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  static async getStages(candidate_id) {
    const result = await getDb().query(`
      SELECT s.id,
             s.candidate_id,
             s.job_stage_id,
             s.decision,
             s.created_at,
             s.updated_at,
             js.name AS stage_name,
             js.stage_order
      FROM candidate_stages s
      JOIN job_stage js ON js.id = s.job_stage_id
      WHERE s.candidate_id = $1
      ORDER BY s.created_at ASC
    `, [candidate_id]);
    return result.rows;
  }

  static async addStage({ candidate_id, job_stage_id, decision }) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      const stageInsert = await client.query(`
        INSERT INTO candidate_stages (candidate_id, job_stage_id, decision)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [candidate_id, job_stage_id, decision]);

      const candidateUpdate = await client.query(`
        UPDATE master_candidate
        SET latest_stage = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [job_stage_id, candidate_id]);

      await client.query('COMMIT');
      return { stage: stageInsert.rows[0], candidate: candidateUpdate.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default CandidatePipeline;
