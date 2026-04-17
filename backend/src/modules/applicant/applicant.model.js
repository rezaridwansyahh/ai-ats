import getDb from "../../config/postgres.js";

class ApplicantModel {
  async create({ job_sourcing_id, name, last_position, address, education, information, date, attachment }) {
    const result = await getDb().query(`
      INSERT INTO master_applicant
        (job_sourcing_id, name, last_position, address, education, information, date, attachment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (name, job_sourcing_id) DO UPDATE SET
        last_position = EXCLUDED.last_position,
        address       = EXCLUDED.address,
        education     = EXCLUDED.education,
        information   = EXCLUDED.information,
        date          = EXCLUDED.date,
        attachment    = EXCLUDED.attachment
      RETURNING *
    `, [job_sourcing_id, name, last_position, address, education || null,
        information || null, date || null, attachment || null]);

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
  async getByJobSourcingId(job_sourcing_id) {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      WHERE job_sourcing_id = $1
      ORDER BY id ASC
    `, [job_sourcing_id]);
    return result.rows;
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

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_applicant
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default new ApplicantModel();
