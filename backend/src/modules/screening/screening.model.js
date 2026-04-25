import getDb from '../../config/postgres.js';

class ScreeningModel {
  async upsertScore({
    applicant_id,
    job_id,
    overall_score,
    position_score,
    skills_score,
    education_score,
    experience_score,
    matched_skills,
    missing_skills,
    summary,
  }) {
    const result = await getDb().query(
      `INSERT INTO applicant_job_score (
         applicant_id, job_id,
         overall_score, position_score, skills_score, education_score, experience_score,
         matched_skills, missing_skills, summary, scored_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
       ON CONFLICT (applicant_id, job_id) DO UPDATE SET
         overall_score    = EXCLUDED.overall_score,
         position_score   = EXCLUDED.position_score,
         skills_score     = EXCLUDED.skills_score,
         education_score  = EXCLUDED.education_score,
         experience_score = EXCLUDED.experience_score,
         matched_skills   = EXCLUDED.matched_skills,
         missing_skills   = EXCLUDED.missing_skills,
         summary          = EXCLUDED.summary,
         scored_at        = NOW()
       RETURNING *`,
      [
        applicant_id,
        job_id,
        overall_score,
        position_score,
        skills_score,
        education_score,
        experience_score,
        matched_skills ? JSON.stringify(matched_skills) : null,
        missing_skills ? JSON.stringify(missing_skills) : null,
        summary || null,
      ]
    );
    return result.rows[0];
  }

  async getByApplicantAndJob(applicant_id, job_id) {
    const result = await getDb().query(
      `SELECT * FROM applicant_job_score
       WHERE applicant_id = $1 AND job_id = $2`,
      [applicant_id, job_id]
    );
    return result.rows[0];
  }

  async setApplicantInformation(applicant_id, information) {
    const result = await getDb().query(
      `UPDATE master_applicant
       SET information = $2
       WHERE id = $1
       RETURNING *`,
      [applicant_id, information ? JSON.stringify(information) : null]
    );
    return result.rows[0];
  }

  async getApplicant(applicant_id) {
    const result = await getDb().query(
      `SELECT * FROM master_applicant WHERE id = $1`,
      [applicant_id]
    );
    return result.rows[0];
  }

  async getCandidatesByJob(job_id) {
    const result = await getDb().query(
      `SELECT mc.id AS candidate_id, mc.applicant_id, mc.job_id
       FROM master_candidate mc
       WHERE mc.job_id = $1 AND mc.applicant_id IS NOT NULL`,
      [job_id]
    );
    return result.rows;
  }

  // Faceted search.
  // mode = 'pool'     → all applicants matching facets, scores from applicant_job_score for the optional job_id.
  // mode = 'pipeline' → only applicants who exist in master_candidate for the given job_id, JOINed to scores.
  async search({
    mode = 'pool',
    job_id = null,
    q = null,
    position_q = null,
    skill_q = null,
    education_q = null,
    location_q = null,
    position = null,
    skills = [],
    skills_mode = 'all',
    min_years = null,
    education_tier = null,
    min_score = null,
    page = 1,
    limit = 20,
  }) {
    const params = [];
    const where = [];

    let scoreJoin = '';
    if (job_id) {
      params.push(job_id);
      scoreJoin = `LEFT JOIN applicant_job_score s
                     ON s.applicant_id = a.id AND s.job_id = $${params.length}`;
    } else {
      scoreJoin = `LEFT JOIN applicant_job_score s ON FALSE`;
    }

    if (mode === 'pipeline') {
      if (!job_id) throw { status: 400, message: 'job_id is required for pipeline mode' };
      // job_id already pushed above as params[0]
      where.push(
        `EXISTS (SELECT 1 FROM master_candidate mc WHERE mc.applicant_id = a.id AND mc.job_id = $1)`
      );
    }

    const qTrimmed = typeof q === 'string' ? q.trim() : '';
    if (qTrimmed) {
      params.push(`%${qTrimmed}%`);
      const p = `$${params.length}`;
      where.push(`(
        a.name ILIKE ${p}
        OR a.last_position ILIKE ${p}
        OR a.education ILIKE ${p}
        OR a.address ILIKE ${p}
        OR (a.information->'job_position'->>'current')  ILIKE ${p}
        OR (a.information->'job_position'->>'category') ILIKE ${p}
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(a.information->'skills','[]'::jsonb)) sk
          WHERE sk ILIKE ${p}
        )
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(COALESCE(a.information->'education','[]'::jsonb)) ed
          WHERE (ed->>'school') ILIKE ${p} OR (ed->>'degree') ILIKE ${p}
        )
      )`);
    }

    const positionQ  = typeof position_q  === 'string' ? position_q.trim()  : '';
    const skillQ     = typeof skill_q     === 'string' ? skill_q.trim()     : '';
    const educationQ = typeof education_q === 'string' ? education_q.trim() : '';
    const locationQ  = typeof location_q  === 'string' ? location_q.trim()  : '';

    if (positionQ) {
      params.push(`%${positionQ}%`);
      const p = `$${params.length}`;
      where.push(`(
        a.last_position ILIKE ${p}
        OR (a.information->'job_position'->>'current')  ILIKE ${p}
        OR (a.information->'job_position'->>'category') ILIKE ${p}
      )`);
    }

    if (skillQ) {
      params.push(`%${skillQ}%`);
      const p = `$${params.length}`;
      where.push(`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(a.information->'skills','[]'::jsonb)) sk
        WHERE sk ILIKE ${p}
      )`);
    }

    if (educationQ) {
      params.push(`%${educationQ}%`);
      const p = `$${params.length}`;
      where.push(`(
        a.education ILIKE ${p}
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(COALESCE(a.information->'education','[]'::jsonb)) ed
          WHERE (ed->>'school') ILIKE ${p} OR (ed->>'degree') ILIKE ${p}
        )
      )`);
    }

    if (locationQ) {
      params.push(`%${locationQ}%`);
      const p = `$${params.length}`;
      where.push(`a.address ILIKE ${p}`);
    }

    if (position) {
      params.push(position);
      where.push(`a.information->'job_position'->>'category' ILIKE $${params.length}`);
    }

    const skillList = Array.isArray(skills) ? skills.filter((s) => typeof s === 'string' && s.trim()) : [];
    if (skillList.length > 0) {
      if (skills_mode === 'any') {
        params.push(skillList);
        where.push(`a.information->'skills' ?| $${params.length}::text[]`);
      } else {
        params.push(JSON.stringify(skillList));
        where.push(`a.information->'skills' @> $${params.length}::jsonb`);
      }
    }

    if (min_years != null) {
      params.push(Number(min_years));
      where.push(
        `COALESCE((a.information->'experience'->>'years_total')::int, 0) >= $${params.length}`
      );
    }

    if (education_tier) {
      params.push(JSON.stringify([{ tier: education_tier }]));
      where.push(`a.information->'education' @> $${params.length}::jsonb`);
    }

    if (min_score != null) {
      params.push(Number(min_score));
      where.push(`s.overall_score >= $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (Math.max(1, Number(page) || 1) - 1) * (Number(limit) || 20);
    const lim = Number(limit) || 20;
    params.push(lim);
    const limPlaceholder = `$${params.length}`;
    params.push(offset);
    const offPlaceholder = `$${params.length}`;

    const sql = `
      SELECT
        a.id  AS applicant_id,
        a.name,
        a.last_position,
        a.address,
        a.education AS education_text,
        a.attachment,
        a.date,
        a.information,
        s.overall_score,
        s.position_score,
        s.skills_score,
        s.education_score,
        s.experience_score,
        s.matched_skills,
        s.missing_skills,
        s.summary,
        s.scored_at,
        COUNT(*) OVER () AS total_count
      FROM master_applicant a
      ${scoreJoin}
      ${whereClause}
      ORDER BY s.overall_score DESC NULLS LAST, a.id ASC
      LIMIT ${limPlaceholder} OFFSET ${offPlaceholder}
    `;

    const result = await getDb().query(sql, params);
    const total = result.rows[0] ? Number(result.rows[0].total_count) : 0;
    const rows = result.rows.map(({ total_count, ...rest }) => rest);
    return { total, rows };
  }
}

export default new ScreeningModel();
