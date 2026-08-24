import getDb from "../../config/postgres.js";

class ApplicantModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getAllByCompanyId(company_id) {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      WHERE company_id = $1
      ORDER BY id ASC
    `, [company_id]);

    return result.rows;
  }

  async getAllByCompanyWithScore(company_id) {
    const result = await getDb().query(`
      SELECT
          ma.*,
          (
              SELECT overall_score
              FROM candidate_job_score cjs
              WHERE cjs.applicant_id = ma.id
              ORDER BY cjs.scored_at DESC  -- or updated_at, or whichever date column
              LIMIT 1
          ) AS latest_score
      FROM master_applicant ma
      WHERE ma.company_id = $1
      ORDER BY latest_score DESC NULLS LAST;  -- Sort by the latest score
    `, [company_id]);

    return result.rows;
  }
  async getById(id) {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async getByEmail(email) {
    const result = await getDb().query(`
      SELECT * FROM master_applicant
      WHERE email = $1
      ORDER BY id ASC
      LIMIT 1
    `, [email]);
    return result.rows[0];
  }

  async getByJobSourcingId(job_sourcing_id) {
    const result = await getDb().query(`
      SELECT ma.*
      FROM master_applicant ma
      JOIN mapping_applicant_sourcing mas ON mas.applicant_id = ma.id
      WHERE mas.job_sourcing_id = $1
      ORDER BY ma.id ASC
    `, [job_sourcing_id]);
    return result.rows;
  }

  async getSourcingsByApplicantId(applicant_id) {
    const result = await getDb().query(`
      SELECT mas.job_sourcing_id, mas.created_at, cjs.platform, cjs.status, cjs.platform_job_id
      FROM mapping_applicant_sourcing mas
      JOIN core_job_sourcing cjs ON cjs.id = mas.job_sourcing_id
      WHERE mas.applicant_id = $1
      ORDER BY mas.created_at ASC
    `, [applicant_id]);
    return result.rows;
  }

  async addSourcingMapping(applicant_id, job_sourcing_id) {
    const result = await getDb().query(`
      INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id)
      VALUES ($1, $2)
      ON CONFLICT (applicant_id, job_sourcing_id) DO NOTHING
      RETURNING *
    `, [applicant_id, job_sourcing_id]);
    return result.rows[0] ?? null;
  }

  // Mirrors the (name, job_sourcing_id) dedup this used to enforce via a
  // UNIQUE constraint before job_sourcing_id moved to mapping_applicant_sourcing.
  // Used by RPA extraction to skip already-synced candidates *before* paying
  // for the expensive per-candidate work (opening the detail modal, downloading
  // the resume) instead of only deduping at insert time.
  async existsByNameAndJobSourcing(name, job_sourcing_id) {
    const result = await getDb().query(`
      SELECT 1 FROM master_applicant ma
      JOIN mapping_applicant_sourcing mas ON mas.applicant_id = ma.id
      WHERE ma.name = $1 AND mas.job_sourcing_id = $2
      LIMIT 1
    `, [name, job_sourcing_id]);
    return result.rowCount > 0;
  }

  // Upserts by email: if `email` matches an existing applicant, that applicant's
  // record is overwritten with the new data (newest sync/upload always wins) and,
  // if `job_sourcing_id` is provided, linked to it via mapping_applicant_sourcing
  // instead of creating a duplicate person. Otherwise inserts a new applicant.
  async create({ job_sourcing_id, upload_batch_id, company_id, name, email, last_position, address, education, information, date, attachment }) {
    const infoJson = information ? JSON.stringify(information) : null;

    let applicant;
    const existing = email ? await this.getByEmail(email) : null;

    if (existing) {
      const result = await getDb().query(`
        UPDATE master_applicant SET
          upload_batch_id = $1,
          company_id      = $2,
          name             = $3,
          last_position    = $4,
          address          = $5,
          education        = $6,
          information      = $7,
          date             = $8,
          attachment       = $9
        WHERE id = $10
        RETURNING *
      `, [
        upload_batch_id || null,
        company_id || null,
        name,
        last_position, address,
        education || null,
        infoJson,
        date || null,
        attachment || null,
        existing.id,
      ]);
      applicant = result.rows[0];
    } else {
      const result = await getDb().query(`
        INSERT INTO master_applicant
          (upload_batch_id, company_id, name, email, last_position, address, education, information, date, attachment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        upload_batch_id || null,
        company_id || null,
        name,
        email || null,
        last_position, address,
        education || null,
        infoJson,
        date || null,
        attachment || null,
      ]);
      applicant = result.rows[0];
    }

    if (job_sourcing_id) {
      await this.addSourcingMapping(applicant.id, job_sourcing_id);
    }

    return applicant;
  }

  async updateAttachment(id, attachment) {
    const result = await getDb().query(`
      UPDATE master_applicant
      SET attachment = $1
      WHERE id = $2
      RETURNING *
    `, [attachment, id]);
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
