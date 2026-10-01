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

  // Paginated + filtered Talent Pool list. Replaces the old "fetch every
  // applicant the company has ever had, filter/sort/paginate in the browser"
  // approach — that doesn't scale past a few hundred rows, and every row ran
  // its own correlated score subquery regardless of whether it was even shown.
  //
  // mapping_applicant_sourcing is NOT unique on applicant_id alone (an
  // applicant can have multiple sourcing rows), so the sourcing join is a
  // LATERAL picking the most recent one — a plain LEFT JOIN would silently
  // duplicate that applicant's row and corrupt both the page contents and
  // the COUNT(*) OVER() total.
  async getPaginatedByCompany(company_id, {
    position_q, education_q, location_q, min_score, skills, page = 1, pageSize = 10,
  } = {}) {
    const limit      = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page) || 1, 1);
    const offset     = (pageNumber - 1) * limit;

    const posParam    = position_q  ? `%${position_q}%`  : null;
    const eduParam     = education_q ? `%${education_q}%` : null;
    const locParam     = location_q  ? `%${location_q}%`  : null;
    const scoreParam   = min_score && min_score > 0 ? min_score : null;
    const skillsParam  = Array.isArray(skills) && skills.length > 0
      ? skills.map((s) => String(s).toLowerCase())
      : null;

    const result = await getDb().query(`
      WITH filtered AS (
        SELECT
          ma.*,
          latest.overall_score AS latest_score,
          src.platform AS source_platform,
          src.job_title AS source_job_title,
          CASE WHEN src.platform IN ('seek', 'linkedin') THEN 'external_platform' ELSE NULL END AS source_type
        FROM master_applicant ma
        LEFT JOIN LATERAL (
          SELECT cjs.platform, cjs.job_title
          FROM mapping_applicant_sourcing mas
          JOIN core_job_sourcing cjs ON cjs.id = mas.job_sourcing_id
          WHERE mas.applicant_id = ma.id
          ORDER BY mas.created_at DESC
          LIMIT 1
        ) src ON true
        LEFT JOIN LATERAL (
          SELECT overall_score
          FROM candidate_job_score s2
          WHERE s2.applicant_id = ma.id
          ORDER BY s2.scored_at DESC
          LIMIT 1
        ) latest ON true
        WHERE ma.company_id = $1
          AND ($2::text IS NULL OR ma.last_position ILIKE $2
               OR (ma.information->'job_position'->>'current') ILIKE $2
               OR (ma.information->'job_position'->>'category') ILIKE $2)
          AND ($3::text IS NULL OR ma.education ILIKE $3 OR EXISTS (
                SELECT 1 FROM jsonb_array_elements(COALESCE(ma.information->'education', '[]'::jsonb)) edu
                WHERE (edu->>'school') ILIKE $3 OR (edu->>'degree') ILIKE $3
              ))
          AND ($4::text IS NULL OR ma.address ILIKE $4)
          AND ($5::int IS NULL OR COALESCE(latest.overall_score, 0) >= $5)
          AND ($6::text[] IS NULL OR (
                SELECT array_agg(lower(s)) FROM jsonb_array_elements_text(COALESCE(ma.information->'skills', '[]'::jsonb)) s
              ) @> $6::text[])
      )
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM filtered
      ORDER BY date DESC NULLS LAST
      LIMIT $7 OFFSET $8
    `, [company_id, posParam, eduParam, locParam, scoreParam, skillsParam, limit, offset]);

    const total = result.rows[0]?.total_count ?? 0;
    const applicants = result.rows.map(({ total_count, ...rest }) => rest);
    return { applicants, total };
  }

  // Unfiltered, company-wide aggregates for the stat tiles — deliberately
  // separate from the paginated list above so paging/filtering the table
  // doesn't make these numbers jump around.
  async getStatsByCompany(company_id) {
    const result = await getDb().query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE date >= NOW() - INTERVAL '7 days')::int AS new_this_week,
        COUNT(DISTINCT information->'job_position'->>'category')::int AS position_categories,
        AVG(
          CASE WHEN COALESCE(information->'experience'->>'years_total', information->>'years_experience') ~ '^[0-9]+(\\.[0-9]+)?$'
               THEN COALESCE(information->'experience'->>'years_total', information->>'years_experience')::numeric
               ELSE NULL END
        ) AS avg_experience
      FROM master_applicant
      WHERE company_id = $1
    `, [company_id]);
    return result.rows[0];
  }

  // Distinct skills + candidate counts across the whole pool, for the filter
  // sidebar's skill picker. Case preserved as stored (not lower-cased) to
  // match the exact tags recruiters typed/extracted, same as before.
  async getSkillsByCompany(company_id) {
    const result = await getDb().query(`
      SELECT skill, COUNT(*)::int AS count
      FROM master_applicant ma, jsonb_array_elements_text(COALESCE(ma.information->'skills', '[]'::jsonb)) skill
      WHERE ma.company_id = $1
      GROUP BY skill
      ORDER BY count DESC
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

  // Every position this applicant has been scored against, newest first —
  // backs the Talent Pool table's "View" modal (history of applications + score).
  async getScoreHistoryByApplicantId(applicant_id) {
    const result = await getDb().query(`
      SELECT
        cjs.job_id,
        cj.job_title,
        cj.status AS job_status,
        cjs.overall_score,
        cjs.skills_score,
        cjs.experience_score,
        cjs.education_score,
        cjs.summary,
        cjs.scored_at
      FROM candidate_job_score cjs
      JOIN core_job cj ON cj.id = cjs.job_id
      WHERE cjs.applicant_id = $1
      ORDER BY cjs.scored_at DESC
    `, [applicant_id]);

    return result.rows;
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
      SELECT mas.job_sourcing_id, mas.information, mas.created_at, cjs.platform, cjs.status, cjs.platform_job_id
      FROM mapping_applicant_sourcing mas
      JOIN core_job_sourcing cjs ON cjs.id = mas.job_sourcing_id
      WHERE mas.applicant_id = $1
      ORDER BY mas.created_at ASC
    `, [applicant_id]);
    return result.rows;
  }

  // `information` here is the raw scraped screening Q&A for THIS application —
  // refreshed on conflict (re-sync) so it stays current with the latest scrape,
  // rather than left stuck on whatever was first recorded.
  async addSourcingMapping(applicant_id, job_sourcing_id, information = null) {
    const result = await getDb().query(`
      INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id, information)
      VALUES ($1, $2, $3)
      ON CONFLICT (applicant_id, job_sourcing_id) DO UPDATE SET
        information = EXCLUDED.information
      RETURNING *
    `, [applicant_id, job_sourcing_id, information ? JSON.stringify(information) : null]);
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

  // Same lookup as existsByNameAndJobSourcing, but returns the row (with its
  // cv_download_status) instead of a boolean — lets a re-sync tell "already
  // fully synced, skip" apart from "resume download failed last time, retry
  // it" for the same (name, job_sourcing_id).
  async getByNameAndJobSourcing(name, job_sourcing_id) {
    const result = await getDb().query(`
      SELECT ma.*
      FROM master_applicant ma
      JOIN mapping_applicant_sourcing mas ON mas.applicant_id = ma.id
      WHERE ma.name = $1 AND mas.job_sourcing_id = $2
      LIMIT 1
    `, [name, job_sourcing_id]);
    return result.rows[0] || null;
  }

  // Upserts by email: if `email` matches an existing applicant, that applicant's
  // record is overwritten with the new data (newest sync/upload always wins) and,
  // if `job_sourcing_id` is provided, linked to it via mapping_applicant_sourcing
  // instead of creating a duplicate person. Otherwise inserts a new applicant.
  // `sourcing_information` is the raw scraped screening Q&A for this specific
  // application — stored on mapping_applicant_sourcing (per job_sourcing_id),
  // not on this applicant row, since it's application-specific (RPA sources
  // like Seek/LinkedIn). `information` here stays the person-level AI-parsed
  // CV facets, shared across every application this applicant has.
  async create({ job_sourcing_id, upload_batch_id, company_id, name, email, last_position, address, education, information, date, attachment, sourcing_information = null, cv_download_status = null }) {
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
          attachment       = $9,
          cv_download_status = $10
        WHERE id = $11
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
        cv_download_status,
        existing.id,
      ]);
      applicant = result.rows[0];
    } else {
      const result = await getDb().query(`
        INSERT INTO master_applicant
          (upload_batch_id, company_id, name, email, last_position, address, education, information, date, attachment, cv_download_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        cv_download_status,
      ]);
      applicant = result.rows[0];
    }

    if (job_sourcing_id) {
      await this.addSourcingMapping(applicant.id, job_sourcing_id, sourcing_information);
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

  async updateEmail(id, email) {
    const result = await getDb().query(`
      UPDATE master_applicant
      SET email = $1
      WHERE id = $2
      RETURNING *
    `, [email, id]);
    return result.rows[0];
  }

  async updateCvDownloadStatus(id, cv_download_status) {
    const result = await getDb().query(`
      UPDATE master_applicant
      SET cv_download_status = $1
      WHERE id = $2
      RETURNING *
    `, [cv_download_status, id]);
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
