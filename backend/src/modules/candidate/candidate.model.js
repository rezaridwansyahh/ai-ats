import db from "../../config/postgres.js";

class CandidateModel {
  async upsert({ job_posting_id, candidate_status, candidate_id, name, last_position, address, education, information, date, attachment }) {
    const result = await db.query(`
      INSERT INTO master_candidates
        (job_posting_id, candidate_status, candidate_id, name, last_position, address, education, information, date, attachment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (candidate_id, job_posting_id) DO UPDATE SET
        candidate_status = EXCLUDED.candidate_status,
        name             = EXCLUDED.name,
        last_position    = EXCLUDED.last_position,
        address          = EXCLUDED.address,
        education        = EXCLUDED.education,
        information      = EXCLUDED.information,
        date             = EXCLUDED.date,
        attachment       = EXCLUDED.attachment
      RETURNING *
    `, [job_posting_id, candidate_status, candidate_id, name, last_position, address, education,
        information ? JSON.stringify(information) : null, date || null, attachment || null]);

    return result.rows[0];
  }

  async getAll() {
    const result = await db.query(`SELECT * FROM master_candidates ORDER BY id ASC`);
    return result.rows;
  }

  async getByJobPostingId(job_posting_id) {
    const result = await db.query(`
      SELECT * FROM master_candidates
      WHERE job_posting_id = $1
      ORDER BY id ASC
    `, [job_posting_id]);
    return result.rows;
  }

  async getById(id) {
    const result = await db.query(`SELECT * FROM master_candidates WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async getByCandidateId(candidate_id) {
    const result = await db.query(`SELECT * FROM master_candidates WHERE candidate_id = $1`, [candidate_id]);
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await db.query(`
      UPDATE master_candidates
      SET candidate_status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(`
      DELETE FROM master_candidates
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default new CandidateModel();
