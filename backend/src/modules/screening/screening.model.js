import getDb from '../../config/postgres.js';

class ScreeningModel {
  async upsertScore({
    applicant_id,
    job_id,
    overall_score,
    skills_score,
    experience_score,
    career_trajectory_score,
    education_score,
    matched_skills,
    missing_skills,
    custom_criteria_results,
    rubric_snapshot,
    role_profile,
    summary,
  }) {
    const result = await getDb().query(
      `INSERT INTO applicant_job_score (
         applicant_id, job_id,
         overall_score, skills_score, experience_score, career_trajectory_score, education_score,
         matched_skills, missing_skills, custom_criteria_results,
         rubric_snapshot, role_profile, summary, scored_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW())
       ON CONFLICT (applicant_id, job_id) DO UPDATE SET
         overall_score            = EXCLUDED.overall_score,
         skills_score             = EXCLUDED.skills_score,
         experience_score         = EXCLUDED.experience_score,
         career_trajectory_score  = EXCLUDED.career_trajectory_score,
         education_score          = EXCLUDED.education_score,
         matched_skills           = EXCLUDED.matched_skills,
         missing_skills           = EXCLUDED.missing_skills,
         custom_criteria_results  = EXCLUDED.custom_criteria_results,
         rubric_snapshot          = EXCLUDED.rubric_snapshot,
         role_profile             = EXCLUDED.role_profile,
         summary                  = EXCLUDED.summary,
         scored_at                = NOW()
       RETURNING *`,
      [
        applicant_id,
        job_id,
        overall_score,
        skills_score,
        experience_score,
        career_trajectory_score,
        education_score,
        matched_skills ? JSON.stringify(matched_skills) : null,
        missing_skills ? JSON.stringify(missing_skills) : null,
        custom_criteria_results ? JSON.stringify(custom_criteria_results) : null,
        rubric_snapshot ? JSON.stringify(rubric_snapshot) : null,
        role_profile || null,
        summary || null,
      ]
    );
    return result.rows[0];
  }

  async getRubric(job_id) {
    const result = await getDb().query(
      `SELECT rubric FROM core_job WHERE id = $1`,
      [job_id]
    );
    return result.rows[0]?.rubric || null;
  }

  async saveRubric(job_id, rubric) {
    const result = await getDb().query(
      `UPDATE core_job SET rubric = $2, updated_at = NOW() WHERE id = $1 RETURNING rubric`,
      [job_id, rubric ? JSON.stringify(rubric) : null]
    );
    return result.rows[0]?.rubric || null;
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

  /* ─── candidate_screening (L3 parent row) ─── */

  // Lazy-creates a candidate_screening row if missing. Idempotent.
  // Returns the parent row id.
  async ensureScreeningForCandidate(candidate_id) {
    const db = getDb();
    const existing = await db.query(
      `SELECT id FROM candidate_screening WHERE candidate_id = $1`,
      [candidate_id]
    );
    if (existing.rows[0]) return existing.rows[0].id;

    // derive job_id + company_id from the candidate
    const meta = await db.query(
      `SELECT mc.job_id, cj.company_id
         FROM master_candidate mc
         LEFT JOIN core_job cj ON cj.id = mc.job_id
         WHERE mc.id = $1`,
      [candidate_id]
    );
    if (!meta.rows[0]) {
      throw { status: 404, message: `master_candidate ${candidate_id} not found` };
    }

    const inserted = await db.query(
      `INSERT INTO candidate_screening (candidate_id, job_id, company_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [candidate_id, meta.rows[0].job_id, meta.rows[0].company_id || null]
    );
    return inserted.rows[0].id;
  }

  // Fully hydrated L3 payload for one screening row.
  async getScreeningById(screening_id) {
    const result = await getDb().query(
      `
      SELECT
        cs.id                  AS screening_id,
        cs.candidate_id,
        cs.job_id,
        cs.company_id,
        cs.decision,
        cs.decision_reason,
        cs.decided_at,
        cs.decided_by,
        cs.created_at          AS screening_created_at,

        mc.applicant_id,
        mc.name                AS candidate_name,
        mc.last_position,
        mc.address,
        mc.education           AS education_text,
        mc.date                AS applied_at,
        mc.attachment,
        mc.latest_stage,

        cj.job_title,
        cj.job_location,
        cj.work_type,
        cj.work_option,
        cj.seniority_level,
        cj.required_skills,
        cj.preferred_skills,
        cj.rubric,
        cj.status              AS job_status,

        ma.information         AS facets,

        s.id                       AS score_id,
        s.overall_score,
        s.skills_score,
        s.experience_score,
        s.career_trajectory_score,
        s.education_score,
        s.matched_skills,
        s.missing_skills,
        s.custom_criteria_results,
        s.rubric_snapshot,
        s.role_profile,
        s.summary              AS score_summary,
        s.scored_at,

        CASE
          WHEN ma.information IS NULL THEN 'parse'
          WHEN s.id IS NULL          THEN 'match'
          ELSE                            'done'
        END AS engine,

        (cj.rubric IS NOT NULL AND s.rubric_snapshot IS NOT NULL AND s.rubric_snapshot IS DISTINCT FROM cj.rubric) AS rubric_is_stale

      FROM candidate_screening cs
      JOIN master_candidate mc ON mc.id = cs.candidate_id
      JOIN core_job cj          ON cj.id = cs.job_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      LEFT JOIN applicant_job_score s
        ON s.applicant_id = mc.applicant_id AND s.job_id = cs.job_id
      WHERE cs.id = $1
      `,
      [screening_id]
    );
    return result.rows[0] || null;
  }

  // Calibration cohort for one job: candidates that have a score AND no
  // decision yet (i.e. ready to be advanced/rejected/held in a batch).
  // Sorted by overall_score DESC so the recruiter sees the best first.
  async getCalibrationCohort(job_id) {
    const result = await getDb().query(
      `
      SELECT
        cs.id                AS screening_id,
        cs.candidate_id,
        cs.company_id,
        cs.decision,
        mc.applicant_id,
        a.name               AS applicant_name,
        a.last_position,
        a.address,
        s.overall_score,
        s.skills_score,
        s.experience_score,
        s.career_trajectory_score,
        s.education_score,
        s.matched_skills,
        s.missing_skills,
        s.summary            AS score_summary,
        s.scored_at,
        s.rubric_snapshot IS DISTINCT FROM cj.rubric AS rubric_is_stale
      FROM candidate_screening cs
      JOIN master_candidate mc       ON mc.id = cs.candidate_id
      JOIN core_job cj                ON cj.id = cs.job_id
      LEFT JOIN master_applicant a    ON a.id  = mc.applicant_id
      JOIN applicant_job_score s
        ON s.applicant_id = mc.applicant_id AND s.job_id = cs.job_id
      WHERE cs.job_id = $1 AND cs.decision IS NULL
      ORDER BY s.overall_score DESC NULLS LAST, cs.id ASC
      `,
      [job_id]
    );
    return result.rows;
  }

  // Transactional bulk advance: mark screenings as advance + insert interview rows.
  // Returns { advanced, skipped, errors, interview_ids }.
  async bulkAdvanceToInterview({ screening_ids, decision_reason, decided_by, company_id }) {
    const client = await getDb().connect();
    const advanced = [];
    const skipped = [];
    const errors = [];
    const interviewIds = [];
    try {
      await client.query('BEGIN');
      for (const sid of screening_ids) {
        try {
          // Lock + read the screening + candidate + job ids in one shot
          const cur = await client.query(
            `SELECT id, candidate_id, job_id, company_id, decision
               FROM candidate_screening
              WHERE id = $1
              FOR UPDATE`,
            [sid]
          );
          const row = cur.rows[0];
          if (!row) { errors.push({ screening_id: sid, message: 'not found' }); continue; }
          if (company_id && row.company_id && row.company_id !== company_id) {
            errors.push({ screening_id: sid, message: 'cross-tenant denied' });
            continue;
          }
          if (row.decision) {
            skipped.push({ screening_id: sid, reason: `already ${row.decision}` });
            continue;
          }

          // Set the decision
          await client.query(
            `UPDATE candidate_screening
                SET decision = 'advance',
                    decision_reason = $2,
                    decided_at = NOW(),
                    decided_by = $3,
                    updated_at = NOW()
              WHERE id = $1`,
            [sid, decision_reason || null, decided_by || null]
          );

          // Create the interview row (ON CONFLICT no-op so retries are safe)
          const ins = await client.query(
            `INSERT INTO candidate_interview (candidate_id, job_id, screening_id, company_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (candidate_id, job_id) DO UPDATE
               SET screening_id = EXCLUDED.screening_id,
                   updated_at = NOW()
             RETURNING id`,
            [row.candidate_id, row.job_id, sid, row.company_id || null]
          );
          interviewIds.push(ins.rows[0].id);
          advanced.push(sid);
        } catch (err) {
          errors.push({ screening_id: sid, message: err.message || String(err) });
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return { advanced, skipped, errors, interview_ids: interviewIds };
  }

  async setScreeningDecision({ screening_id, decision, decision_reason, decided_by }) {
    const result = await getDb().query(
      `UPDATE candidate_screening
          SET decision = $2,
              decision_reason = $3,
              decided_at = NOW(),
              decided_by = $4,
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [screening_id, decision, decision_reason || null, decided_by || null]
    );
    return result.rows[0] || null;
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

  // Workboard data scoped to a company.
  // Engine status is derived from existing tables (no candidate_screening parent yet):
  //   parse  = master_applicant.information IS NULL
  //   match  = parsed but no applicant_job_score row for this (applicant, job)
  //   ready  = applicant_job_score row exists
  //   qa     = 0 for v1 (engine not implemented)
  // Returns { counts, positions, attention } shaped for the L1 Workboard UI.
  async getWorkboardData(company_id) {
    const db = getDb();

    // Per-job engine breakdown — single query, one row per (job, engine).
    const positionRows = await db.query(
      `
      WITH candidate_engine AS (
        SELECT
          mc.job_id,
          mc.applicant_id,
          CASE
            WHEN ma.information IS NULL THEN 'parse'
            WHEN s.id IS NULL          THEN 'match'
            ELSE 'ready'
          END AS engine
        FROM master_candidate mc
        JOIN core_job cj            ON cj.id = mc.job_id
        LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
        LEFT JOIN applicant_job_score s
          ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
        WHERE cj.company_id = $1 AND mc.applicant_id IS NOT NULL
      )
      SELECT
        cj.id                                   AS job_id,
        cj.job_title,
        cj.status,
        COUNT(ce.applicant_id)                  AS total,
        COUNT(*) FILTER (WHERE ce.engine='parse') AS parse,
        COUNT(*) FILTER (WHERE ce.engine='match') AS match,
        0::int                                  AS qa,
        COUNT(*) FILTER (WHERE ce.engine='ready') AS ready
      FROM core_job cj
      LEFT JOIN candidate_engine ce ON ce.job_id = cj.id
      WHERE cj.company_id = $1
      GROUP BY cj.id, cj.job_title, cj.status
      ORDER BY cj.status = 'Active' DESC, cj.id ASC
      `,
      [company_id]
    );

    const positions = positionRows.rows.map((r) => ({
      job_id: r.job_id,
      job_title: r.job_title,
      status: r.status,
      total: Number(r.total),
      parse: Number(r.parse),
      match: Number(r.match),
      qa: Number(r.qa),
      ready: Number(r.ready),
    }));

    const counts = positions.reduce(
      (acc, p) => {
        acc.parse += p.parse;
        acc.match += p.match;
        acc.qa    += p.qa;
        acc.ready += p.ready;
        return acc;
      },
      { parse: 0, match: 0, qa: 0, ready: 0 }
    );

    // Needs-attention feed (v1 subset)
    //
    // 1) Stale rubric — candidates already scored, but the job's rubric has changed since.
    const staleRows = await db.query(
      `
      SELECT s.applicant_id, s.job_id, a.name AS applicant_name,
             cj.job_title, s.overall_score, s.scored_at
      FROM applicant_job_score s
      JOIN core_job cj          ON cj.id = s.job_id
      LEFT JOIN master_applicant a ON a.id = s.applicant_id
      WHERE cj.company_id = $1
        AND cj.rubric IS NOT NULL
        AND s.rubric_snapshot IS DISTINCT FROM cj.rubric
      ORDER BY s.scored_at DESC
      LIMIT 10
      `,
      [company_id]
    );

    const attention = {
      ready_per_job:          positions.filter((p) => p.ready > 0).map((p) => ({ job_id: p.job_id, job_title: p.job_title, count: p.ready })),
      needs_parsing_per_job:  positions.filter((p) => p.parse > 0).map((p) => ({ job_id: p.job_id, job_title: p.job_title, count: p.parse })),
      needs_matching_per_job: positions.filter((p) => p.match > 0).map((p) => ({ job_id: p.job_id, job_title: p.job_title, count: p.match })),
      stale_rubric:           staleRows.rows,
    };

    return { counts, positions, attention };
  }

  // Returns candidates in a job filtered by engine status. Used by L1/L2 lane lists.
  // Engine derivation matches getWorkboardData.
  // Joins candidate_screening when available (lazy-created on first L3 visit)
  // so the frontend can deep-link rows straight into L3.
  async getCandidatesByJobAndEngine(job_id, engine) {
    const db = getDb();
    const result = await db.query(
      `
      SELECT
        mc.id          AS candidate_id,
        mc.applicant_id,
        mc.job_id,
        a.name        AS applicant_name,
        a.last_position,
        a.address,
        a.date        AS applied_at,
        a.information IS NOT NULL AS is_parsed,
        s.id          AS score_id,
        s.overall_score,
        s.scored_at,
        cs.id         AS screening_id,
        cs.decision,
        CASE
          WHEN a.information IS NULL THEN 'parse'
          WHEN s.id IS NULL          THEN 'match'
          ELSE                            'ready'
        END AS engine
      FROM master_candidate mc
      LEFT JOIN master_applicant a   ON a.id = mc.applicant_id
      LEFT JOIN applicant_job_score s
        ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
      LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
      WHERE mc.job_id = $1 AND mc.applicant_id IS NOT NULL
      ORDER BY mc.created_at DESC
      `,
      [job_id]
    );
    const rows = result.rows;
    return engine ? rows.filter((r) => r.engine === engine) : rows;
  }

  async getResultsByJob(job_id) {
    const result = await getDb().query(
      `SELECT s.id, s.applicant_id, s.job_id,
              s.overall_score, s.skills_score, s.experience_score,
              s.career_trajectory_score, s.education_score,
              s.matched_skills, s.missing_skills, s.custom_criteria_results,
              s.rubric_snapshot, s.role_profile, s.summary, s.scored_at,
              a.name AS applicant_name
       FROM applicant_job_score s
       LEFT JOIN master_applicant a ON a.id = s.applicant_id
       WHERE s.job_id = $1
       ORDER BY s.overall_score DESC, s.applicant_id ASC`,
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

    // Helper: push two params (ILIKE wildcard form and raw form for trigram <%)
    // and return placeholders for both. The trigram operator `<%` ("strict word
    // similarity") returns true when there is a substring of the right operand
    // similar enough to the left operand — perfect for short queries against
    // longer text. Default threshold is 0.6 (set via pg_trgm.word_similarity_threshold).
    const pushFuzzy = (raw) => {
      params.push(`%${raw}%`);
      params.push(raw);
      return { ilike: `$${params.length - 1}`, trgm: `$${params.length}` };
    };

    const qTrimmed = typeof q === 'string' ? q.trim() : '';
    if (qTrimmed) {
      const { ilike, trgm } = pushFuzzy(qTrimmed);
      where.push(`(
        a.name ILIKE ${ilike} OR ${trgm}::text <% a.name
        OR a.last_position ILIKE ${ilike} OR ${trgm}::text <% a.last_position
        OR a.education ILIKE ${ilike} OR ${trgm}::text <% a.education
        OR a.address ILIKE ${ilike} OR ${trgm}::text <% a.address
        OR (a.information->'job_position'->>'current')  ILIKE ${ilike}
        OR ${trgm}::text <% (a.information->'job_position'->>'current')
        OR (a.information->'job_position'->>'category') ILIKE ${ilike}
        OR ${trgm}::text <% (a.information->'job_position'->>'category')
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(a.information->'skills','[]'::jsonb)) sk
          WHERE sk ILIKE ${ilike} OR ${trgm}::text <% sk
        )
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(COALESCE(a.information->'education','[]'::jsonb)) ed
          WHERE (ed->>'school') ILIKE ${ilike} OR ${trgm}::text <% (ed->>'school')
             OR (ed->>'degree') ILIKE ${ilike} OR ${trgm}::text <% (ed->>'degree')
        )
      )`);
    }

    const positionQ  = typeof position_q  === 'string' ? position_q.trim()  : '';
    const skillQ     = typeof skill_q     === 'string' ? skill_q.trim()     : '';
    const educationQ = typeof education_q === 'string' ? education_q.trim() : '';
    const locationQ  = typeof location_q  === 'string' ? location_q.trim()  : '';

    if (positionQ) {
      const { ilike, trgm } = pushFuzzy(positionQ);
      where.push(`(
        a.last_position ILIKE ${ilike} OR ${trgm}::text <% a.last_position
        OR (a.information->'job_position'->>'current')  ILIKE ${ilike}
        OR ${trgm}::text <% (a.information->'job_position'->>'current')
        OR (a.information->'job_position'->>'category') ILIKE ${ilike}
        OR ${trgm}::text <% (a.information->'job_position'->>'category')
      )`);
    }

    if (skillQ) {
      const { ilike, trgm } = pushFuzzy(skillQ);
      where.push(`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(a.information->'skills','[]'::jsonb)) sk
        WHERE sk ILIKE ${ilike} OR ${trgm}::text <% sk
      )`);
    }

    if (educationQ) {
      const { ilike, trgm } = pushFuzzy(educationQ);
      where.push(`(
        a.education ILIKE ${ilike} OR ${trgm}::text <% a.education
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(COALESCE(a.information->'education','[]'::jsonb)) ed
          WHERE (ed->>'school') ILIKE ${ilike} OR ${trgm}::text <% (ed->>'school')
             OR (ed->>'degree') ILIKE ${ilike} OR ${trgm}::text <% (ed->>'degree')
        )
      )`);
    }

    if (locationQ) {
      const { ilike, trgm } = pushFuzzy(locationQ);
      where.push(`(a.address ILIKE ${ilike} OR ${trgm}::text <% a.address)`);
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
        s.skills_score,
        s.experience_score,
        s.career_trajectory_score,
        s.education_score,
        s.matched_skills,
        s.missing_skills,
        s.custom_criteria_results,
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
