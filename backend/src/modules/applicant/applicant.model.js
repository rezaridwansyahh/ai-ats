import getDb from "../../config/postgres.js";

class ApplicantModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async getByJobSourcingId(job_sourcing_id) {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      WHERE job_sourcing_id = $1
      ORDER BY id ASC
    `, [job_sourcing_id]);
    return result.rows;
  }

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
    `, [
      job_sourcing_id, name, last_position, address,
      education || null,
      information ? JSON.stringify(information) : null,
      date || null,
      attachment || null,
    ]);
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
