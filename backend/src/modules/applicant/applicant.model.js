import getDb from "../../config/postgres.js"

const APPLICANT_SELECT = `
  SELECT a.id,
         a.job_id,
         a.candidate_id,
         a.latest_stage,
         a.created_at,
         a.updated_at,
         c.name AS candidate_name,
         latest.job_stage_id AS latest_stage_id,
         COALESCE(js.name, 'Not Started') AS latest_stage_name
  FROM applicants a
  LEFT JOIN master_candidates c ON a.candidate_id = c.id
  LEFT JOIN LATERAL (
    SELECT job_stage_id, decision, created_at
    FROM applicants_stages
    WHERE applicant_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
  ) latest ON TRUE
  LEFT JOIN job_stage js ON js.id = latest.job_stage_id
`;

class Applicant {
  static async getAll() {
    const result = await getDb().query(`
      ${APPLICANT_SELECT}
      ORDER BY a.created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      ${APPLICANT_SELECT}
      WHERE a.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByJobId(job_id) {
    const result = await getDb().query(`
      ${APPLICANT_SELECT}
      WHERE a.job_id = $1
      ORDER BY a.created_at DESC
    `, [job_id]);
    return result.rows;
  }

  static async create({ job_id, candidate_id, latest_stage, job_stage_id, decision }){
    const addApplicant = await getDb().query(`
      INSERT INTO applicants (job_id, candidate_id, latest_stage)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [job_id, candidate_id, latest_stage]);

    const addApplicantStage = await getDb().query(`
      INSERT INTO applicants_stages (applicant_id, job_stage_id, decision)
      VALUES ($1, $2, $3)
      RETURNING *
      `, [addApplicant.rows[0].id, job_stage_id, decision]);
    
    return {applicant: addApplicant.rows[0], stage: addApplicantStage.rows[0]};
  }  

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE applicants
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM applicants
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  static async getStages(applicant_id) {
    const result = await getDb().query(`
      SELECT s.id,
             s.applicant_id,
             s.job_stage_id,
             s.decision,
             s.created_at,
             s.updated_at,
             js.name AS stage_name,
             js.stage_order
      FROM applicants_stages s
      JOIN job_stage js ON js.id = s.job_stage_id
      WHERE s.applicant_id = $1
      ORDER BY s.created_at ASC
    `, [applicant_id]);
    return result.rows;
  }

  static async addStage({ applicant_id, job_stage_id, decision }) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      const stageInsert = await client.query(`
        INSERT INTO applicants_stages (applicant_id, job_stage_id, decision)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [applicant_id, job_stage_id, decision]);

      const applicantUpdate = await client.query(`
        UPDATE applicants
        SET latest_stage = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [job_stage_id, applicant_id]);

      await client.query('COMMIT');
      return { stage: stageInsert.rows[0], applicant: applicantUpdate.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default Applicant;
