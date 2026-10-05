import getDb from '../../config/postgres.js';

class ScreeningModel {
  async upsertScore({
    applicant_id,
    job_id,
    overall_score,
    skills_score,
    skills_reason,
    experience_score,
    experience_reason,
    education_score,
    education_reason,
    matched_skills,
    missing_skills,
    custom_criteria_results,
    rubric_snapshot,
    summary,
  }) {
    const result = await getDb().query(
      `INSERT INTO candidate_job_score (
         applicant_id, job_id,
         overall_score, skills_score, skills_reason, experience_score, experience_reason,
         education_score, education_reason,
         matched_skills, missing_skills, custom_criteria_results,
         rubric_snapshot, summary, scored_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, NOW())
       ON CONFLICT (applicant_id, job_id) DO UPDATE SET
         overall_score            = EXCLUDED.overall_score,
         skills_score             = EXCLUDED.skills_score,
         skills_reason            = EXCLUDED.skills_reason,
         experience_score         = EXCLUDED.experience_score,
         experience_reason        = EXCLUDED.experience_reason,
         education_score          = EXCLUDED.education_score,
         education_reason         = EXCLUDED.education_reason,
         matched_skills           = EXCLUDED.matched_skills,
         missing_skills           = EXCLUDED.missing_skills,
         custom_criteria_results  = EXCLUDED.custom_criteria_results,
         rubric_snapshot          = EXCLUDED.rubric_snapshot,
         summary                  = EXCLUDED.summary,
         scored_at                = NOW()
       RETURNING *`,
      [
        applicant_id,
        job_id,
        overall_score,
        skills_score,
        skills_reason || null,
        experience_score,
        experience_reason || null,
        education_score,
        education_reason || null,
        matched_skills ? JSON.stringify(matched_skills) : null,
        missing_skills ? JSON.stringify(missing_skills) : null,
        custom_criteria_results ? JSON.stringify(custom_criteria_results) : null,
        rubric_snapshot ? JSON.stringify(rubric_snapshot) : null,
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
      `SELECT * FROM candidate_job_score
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
        COALESCE(ma.information, mc.information) AS facets,
        s.id                       AS score_id,
        s.overall_score,
        s.skills_score,
        s.skills_reason,
        s.experience_score,
        s.experience_reason,
        s.education_score,
        s.education_reason,
        s.matched_skills,
        s.missing_skills,
        s.custom_criteria_results,
        s.rubric_snapshot,
        s.summary              AS score_summary,
        s.scored_at,
        CASE
          WHEN COALESCE(ma.information, mc.information) IS NULL THEN 'parse'
          WHEN s.id IS NULL                                     THEN 'match'
          ELSE                                                       'done'
        END AS engine,
        (cj.rubric IS NOT NULL AND s.rubric_snapshot IS NOT NULL AND s.rubric_snapshot IS DISTINCT FROM cj.rubric) AS rubric_is_stale
      FROM candidate_screening cs
      JOIN master_candidate mc ON mc.id = cs.candidate_id
      JOIN core_job cj          ON cj.id = cs.job_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      LEFT JOIN candidate_job_score s
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
  // Server-side paginated + filterable (search by name, bucket = the same
  // advance/awaiting/archive recommendation buckets the UI already used to
  // show as separate stat cards/columns — now a filter instead). Also
  // returns bucket_counts (computed over the FULL cohort, not just this
  // page) so the filter pills can show a count without a separate call.
  async getCalibrationCohort(job_id, { search, bucket, min_score, page, pageSize } = {}) {
    const limit  = pageSize !== undefined ? Math.min(Math.max(Number(pageSize) || 10, 1), 100) : null;
    const offset = (page !== undefined && limit != null) ? (Math.max(Number(page) || 1, 1) - 1) * limit : 0;
    const searchParam = search ? `%${search}%` : null;
    const bucketParam = ['advance', 'awaiting', 'archive'].includes(bucket) ? bucket : null;
    const minScoreParam = min_score !== undefined && min_score !== null && min_score !== '' ? Number(min_score) : null;

    const BASE_CTE = `
      WITH base AS (
        SELECT
          cs.id                AS screening_id,
          mc.id                AS candidate_id,
          cs.company_id,
          cs.decision,
          mc.applicant_id,
          a.name               AS applicant_name,
          a.last_position,
          a.address,
          mc.information,
          s.overall_score,
          s.skills_score,
          s.experience_score,
          s.education_score,
          s.matched_skills,
          s.missing_skills,
          s.summary            AS score_summary,
          s.scored_at,
          s.rubric_snapshot IS DISTINCT FROM cj.rubric AS rubric_is_stale,
          sq.status            AS qa_status,
          app_qa.information    AS application_qa,
          -- Mirrors frontend shared.js's scoreRecommendation() bucket
          -- boundaries exactly (80+ / 60-79 / below 60).
          CASE
            WHEN s.overall_score >= 80 THEN 'advance'
            WHEN s.overall_score >= 60 THEN 'awaiting'
            ELSE 'archive'
          END AS bucket
        FROM master_candidate mc
        JOIN core_job cj                ON cj.id = mc.job_id
        JOIN candidate_job_score s
          ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
        LEFT JOIN master_applicant a    ON a.id  = mc.applicant_id
        -- candidate_screening is lazily created on first L3 (candidate-detail)
        -- visit — LEFT JOIN so a scored candidate isn't hidden from the ranking
        -- just because nobody has opened their profile yet.
        LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
        LEFT JOIN screening_qa sq ON sq.screening_id = cs.id
        LEFT JOIN LATERAL (
          SELECT mas.information
          FROM mapping_applicant_sourcing mas
          JOIN mapping_job_sourcing_job mjsj ON mjsj.job_sourcing_id = mas.job_sourcing_id
          WHERE mas.applicant_id = mc.applicant_id AND mjsj.job_id = mc.job_id
          ORDER BY mas.created_at DESC
          LIMIT 1
        ) app_qa ON true
        WHERE mc.job_id = $1 AND cs.decision IS NULL
      ),
      searched AS (
        SELECT * FROM base
        WHERE ($2::text IS NULL OR applicant_name ILIKE $2)
          AND ($3::int IS NULL OR COALESCE(overall_score, -1) >= $3)
      )
    `;

    // Run as two independent queries rather than attaching aggregates to the
    // paginated rows — if the current bucket/search combination matches zero
    // rows, there'd be no row left to carry the bucket_counts on, and the
    // pills would wrongly show every count as 0 instead of their real values.
    // BASE_CTE only ever references $1-$3 (job_id/search/min_score), shared
    // by both queries below — bucket/limit/offset are appended starting at
    // $4 in the rows query only, so the counts query never needs to pass
    // unused placeholder params (which errors with "could not determine
    // data type of parameter" since nothing in that query text would give
    // them a type to infer).
    const [rowsResult, countsResult] = await Promise.all([
      getDb().query(
        `
        ${BASE_CTE}
        SELECT *, COUNT(*) OVER()::int AS total_count
        FROM searched
        WHERE ($4::text IS NULL OR bucket = $4)
        ORDER BY overall_score DESC NULLS LAST, screening_id ASC NULLS LAST
        LIMIT $5 OFFSET $6
        `,
        [job_id, searchParam, minScoreParam, bucketParam, limit, offset]
      ),
      getDb().query(
        `
        ${BASE_CTE}
        SELECT
          COUNT(*) FILTER (WHERE bucket = 'advance')::int  AS advance_count,
          COUNT(*) FILTER (WHERE bucket = 'awaiting')::int AS awaiting_count,
          COUNT(*) FILTER (WHERE bucket = 'archive')::int  AS archive_count
        FROM searched
        `,
        [job_id, searchParam, minScoreParam]
      ),
    ]);

    const total = rowsResult.rows[0]?.total_count ?? 0;
    const rows = rowsResult.rows.map(({ total_count, ...rest }) => rest);
    const bucket_counts = {
      advance: countsResult.rows[0]?.advance_count ?? 0,
      awaiting: countsResult.rows[0]?.awaiting_count ?? 0,
      archive: countsResult.rows[0]?.archive_count ?? 0,
    };
    return { rows, total, bucket_counts };
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
  //   match  = parsed but no candidate_job_score row for this (applicant, job)
  //   ready  = candidate_job_score row exists
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
          mc.latest_stage,
          CASE
            WHEN ma.information IS NULL THEN 'parse'
            WHEN s.id IS NULL          THEN 'match'
            WHEN sq IS NULL            THEN 'qa'
            ELSE 'ready'
          END AS engine
        FROM master_candidate mc
        JOIN core_job cj ON cj.id = mc.job_id
        LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
        LEFT JOIN candidate_job_score s
          ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
        LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
        LEFT JOIN screening_qa sq ON sq.screening_id = cs.id
        LEFT JOIN job_stage js ON js.id = mc.latest_stage
        LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
        WHERE cj.company_id = $1
          AND mc.applicant_id IS NOT NULL
          AND rsc.name = 'Screening & Matching'
      )
      SELECT
        cj.id                                          AS job_id,
        cj.job_title,
        cj.status,
        COUNT(ce.applicant_id)                         AS total,
        COUNT(*) FILTER (WHERE ce.engine = 'parse')    AS parse,
        COUNT(*) FILTER (WHERE ce.engine = 'match')    AS match,
        COUNT(*) FILTER (WHERE ce.engine = 'qa')       AS qa,
        COUNT(*) FILTER (WHERE ce.engine = 'ready')    AS ready
      FROM core_job cj
      LEFT JOIN candidate_engine ce ON ce.job_id = cj.id
      WHERE cj.company_id = $1 AND cj.status = 'Active'
      GROUP BY cj.id, cj.job_title, cj.status
      HAVING COUNT(ce.applicant_id) > 0
      ORDER BY cj.id ASC
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
      FROM candidate_job_score s
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
        mc.applicant_id,                        -- ← add this line
        mc.job_id,
        a.name         AS applicant_name,
        a.last_position,
        a.address,
        a.date         AS applied_at,
        a.information IS NOT NULL AS is_parsed,
        s.id           AS score_id,
        s.overall_score,
        s.skills_score,
        s.experience_score,
        s.education_score,
        s.matched_skills,
        s.missing_skills,
        s.scored_at,
        cs.id          AS screening_id,
        cs.decision,
        sq.status      AS qa_status,
        app_qa.information AS application_qa,
        CASE
          WHEN a.information IS NULL                        THEN 'parse'
          WHEN s.id IS NULL                                  THEN 'match'
          WHEN sq.status IS DISTINCT FROM 'responded'        THEN 'qa'
          ELSE                                                    'ready'
        END AS engine
      FROM master_candidate mc
      LEFT JOIN master_applicant a ON a.id = mc.applicant_id
      LEFT JOIN candidate_job_score s
        ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
      LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
      LEFT JOIN screening_qa sq ON sq.screening_id = cs.id
      LEFT JOIN job_stage js ON js.id = mc.latest_stage
      LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
      LEFT JOIN LATERAL (
        SELECT mas.information
        FROM mapping_applicant_sourcing mas
        JOIN mapping_job_sourcing_job mjsj ON mjsj.job_sourcing_id = mas.job_sourcing_id
        WHERE mas.applicant_id = mc.applicant_id AND mjsj.job_id = mc.job_id
        ORDER BY mas.created_at DESC
        LIMIT 1
      ) app_qa ON true
      WHERE mc.job_id = $1
        AND mc.applicant_id IS NOT NULL
        AND rsc.name = 'Screening & Matching'
      ORDER BY mc.created_at DESC
      `,
      [job_id]
    );
    const rows = result.rows;
    if (!engine) return rows; // back-compat flat list — see AIScreeningWorkboard's cross-job usage

    // Each stage tab's dashboard needs more than just "its own" bucket to
    // show both what's pending AND what it already produced (that output
    // naturally lives in the NEXT bucket) — e.g. Match wants to show
    // already-scored candidates (the 'qa' bucket) alongside its own pending
    // queue. Rather than make the frontend fire a second request for that
    // adjacent bucket (as it used to), shape it into this same single
    // response so one tab visit is still exactly one HTTP call.
    const byEngine = (key) => rows.filter((r) => r.engine === key);
    if (engine === 'parse') {
      return { pending: byEngine('parse') };
    }
    if (engine === 'match') {
      return { pending: byEngine('match'), scored: byEngine('qa') };
    }
    if (engine === 'qa') {
      // The 'qa' bucket groups together every scored-but-not-responded
      // candidate — qa_status NULL (never sent), 'draft', 'sent', AND
      // 'expired' all land here, since the CASE above only distinguishes
      // "responded" from "everything else". "Sent · awaiting reply" means
      // qa_status === 'sent' specifically — without this filter it silently
      // counted every scored candidate as "awaiting reply" even when Q&A
      // was never sent to them at all (sq.status NULL).
      //
      // "responded" candidates have moved into the 'ready' bucket by
      // definition (qa_status === 'responded' is exactly what promotes them
      // out of 'qa') — excluding already-decided ones so this matches
      // getCalibrationCohort's "awaiting decision" semantics.
      return {
        pending: byEngine('qa').filter((r) => r.qa_status === 'sent'),
        responded: byEngine('ready').filter((r) => !r.decision),
      };
    }
    // No 'ready' case here deliberately: this CASE expression's 'ready'
    // bucket requires qa_status = 'responded', which wrongly excludes a
    // scored, undecided candidate who was simply never sent Q&A at all (Q&A
    // is optional, not a prerequisite to advance). getCalibrationCohort
    // has the correct, broader "scored + no decision yet" definition —
    // callers needing the Ready tab's cohort must use that, not this.
    return byEngine(engine);
  }

  // Lightweight counts-only version of the parse/match/qa/ready split above,
  // for the AI Screening page's summary tiles. Those tiles need to render
  // immediately regardless of which stage tab the recruiter has open, so
  // this is always fetched eagerly — while the full per-candidate rows for
  // each lane (getCandidatesByJobAndEngine) and the ready cohort
  // (getCalibrationCohort) are now fetched lazily, only when that tab is
  // actually opened. No joined candidate fields are selected here — just
  // COUNT(*) — so this stays cheap even as the other two grow large enough
  // to need their own pagination.
  async getEngineCounts(job_id) {
    const db = getDb();
    const laneResult = await db.query(
      `
      SELECT
        CASE
          WHEN a.information IS NULL                        THEN 'parse'
          WHEN s.id IS NULL                                  THEN 'match'
          WHEN sq.status IS DISTINCT FROM 'responded'        THEN 'qa'
          ELSE                                                    'ready'
        END AS engine,
        COUNT(*)::int AS count,
        -- Within the 'qa' bucket, sq.status is NULL/'draft'/'sent'/'expired'
        -- all lumped together (anything not 'responded') — but the QA tile's
        -- "in progress" figure means "actually sent, awaiting reply"
        -- specifically. A candidate who was never sent Q&A at all (status
        -- IS NULL — true for every candidate until Follow-up Q&A is used)
        -- isn't "in progress"; counting them here was inflating this to the
        -- full qa-bucket size regardless of whether anything was ever sent.
        COUNT(*) FILTER (WHERE sq.status = 'sent')::int AS sent_count
      FROM master_candidate mc
      LEFT JOIN master_applicant a ON a.id = mc.applicant_id
      LEFT JOIN candidate_job_score s
        ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
      LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
      LEFT JOIN screening_qa sq ON sq.screening_id = cs.id
      LEFT JOIN job_stage js ON js.id = mc.latest_stage
      LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
      WHERE mc.job_id = $1
        AND mc.applicant_id IS NOT NULL
        AND rsc.name = 'Screening & Matching'
      GROUP BY engine
      `,
      [job_id]
    );

    // "ready" here mirrors getCalibrationCohort's stricter definition (scored,
    // no decision yet) — NOT the laneResult 'ready' bucket above, which
    // doesn't filter out already-decided candidates (held/rejected candidates
    // keep their stage category, so they'd still count there otherwise).
    const cohortResult = await db.query(
      `
      SELECT
        COUNT(*)::int AS ready_count,
        COUNT(*) FILTER (WHERE sq.status = 'responded')::int AS qa_responded_count
      FROM master_candidate mc
      JOIN candidate_job_score s
        ON s.applicant_id = mc.applicant_id AND s.job_id = mc.job_id
      LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
      LEFT JOIN screening_qa sq ON sq.screening_id = cs.id
      WHERE mc.job_id = $1 AND cs.decision IS NULL
      `,
      [job_id]
    );

    const byEngine = Object.fromEntries(laneResult.rows.map((r) => [r.engine, r.count]));
    const qaRow = laneResult.rows.find((r) => r.engine === 'qa');
    return {
      parse: byEngine.parse || 0,
      match: byEngine.match || 0,
      qa: byEngine.qa || 0,
      // "Actually sent, awaiting reply" — a strict subset of the 'qa' bucket
      // above. Use this (not `qa`) for any "in progress" / "awaiting reply"
      // display; `qa` itself still includes never-sent candidates, which is
      // correct for its OTHER use as "already scored" in the Parse/Match
      // tiles' footers, just wrong for a Q&A-specific count.
      qa_sent: qaRow?.sent_count || 0,
      ready: cohortResult.rows[0]?.ready_count || 0,
      qa_responded: cohortResult.rows[0]?.qa_responded_count || 0,
    };
  }

  // Every applicant_id on this job (any engine stage) — used by the
  // match-rescore worker to derive a fresh "everyone" list right before
  // force-rescoring, immune to staleness vs. whatever the browser had loaded
  // when the modal was opened.
  async getApplicantIdsForJob(job_id) {
    const result = await getDb().query(`
      SELECT mc.applicant_id
      FROM master_candidate mc
      LEFT JOIN job_stage js ON js.id = mc.latest_stage
      LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
      WHERE mc.job_id = $1
        AND mc.applicant_id IS NOT NULL
        AND rsc.name = 'Screening & Matching'
    `, [job_id]);
    return result.rows.map((r) => r.applicant_id);
  }

  async getResultsByJob(job_id) {
    const result = await getDb().query(
      `SELECT s.id, s.applicant_id, s.job_id,
              s.overall_score, s.skills_score, s.skills_reason,
              s.experience_score, s.experience_reason,
              s.education_score, s.education_reason,
              s.matched_skills, s.missing_skills, s.custom_criteria_results,
              s.rubric_snapshot, s.summary, s.scored_at,
              a.name AS applicant_name
       FROM candidate_job_score s
       LEFT JOIN master_applicant a ON a.id = s.applicant_id
       WHERE s.job_id = $1
       ORDER BY s.overall_score DESC, s.applicant_id ASC`,
      [job_id]
    );
    return result.rows;
  }

  // Faceted search.
  // mode = 'pool'     → all applicants matching facets, scores from candidate_job_score for the optional job_id.
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
      scoreJoin = `LEFT JOIN candidate_job_score s
                     ON s.applicant_id = a.id AND s.job_id = $${params.length}`;
    } else {
      scoreJoin = `LEFT JOIN candidate_job_score s ON FALSE`;
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
        s.skills_reason,
        s.experience_score,
        s.experience_reason,
        s.education_score,
        s.education_reason,
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

  async getQaContext(screening_id) {
    const result = await getDb().query(
      `
      SELECT
        cs.id          AS screening_id,
        cs.candidate_id,
        cs.job_id,
        mc.applicant_id,
        mc.name        AS candidate_name,
        ma.email       AS candidate_email,
        ma.information AS facets,
        cj.job_title
      FROM candidate_screening cs
      JOIN master_candidate mc ON mc.id = cs.candidate_id
      JOIN core_job cj          ON cj.id = cs.job_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      WHERE cs.id = $1
      `,
      [screening_id]
    );
    return result.rows[0] || null;
  }

  async getQaByScreening(screening_id) {
    const result = await getDb().query(
      `SELECT * FROM screening_qa WHERE screening_id = $1`,
      [screening_id]
    );
    return result.rows[0] || null;
  }

  // Insert or replace the Q&A set for a screening; regenerate resets it to draft.
  // If the existing row was 'sent', a new token is generated so the old portal link
  // is permanently invalidated — the recruiter must send a fresh email.
  async upsertQa({ screening_id, focus_area, language, num_questions, questions, created_by }) {
    const result = await getDb().query(
      `
      INSERT INTO screening_qa (screening_id, focus_area, language, num_questions, questions, status, created_by)
      VALUES ($1, $2, $3, $4, $5::jsonb, 'draft', $6)
      ON CONFLICT (screening_id) DO UPDATE SET
        focus_area    = EXCLUDED.focus_area,
        language      = EXCLUDED.language,
        num_questions = EXCLUDED.num_questions,
        questions     = EXCLUDED.questions,
        status        = 'draft',
        token         = CASE
                          WHEN screening_qa.status = 'sent' THEN gen_random_uuid()
                          ELSE screening_qa.token
                        END,
        answers       = NULL,
        application_form        = NULL,
        application_form_schema = NULL,
        sent_at       = NULL,
        responded_at  = NULL,
        expired_at    = NULL,
        updated_at    = NOW()
      RETURNING *
      `,
      [screening_id, focus_area || null, language || null, num_questions || null, JSON.stringify(questions || []), created_by || null]
    );
    return result.rows[0];
  }

  async updateQaQuestions(screening_id, questions) {
    const result = await getDb().query(
      `
      UPDATE screening_qa
      SET questions = $2::jsonb, updated_at = NOW()
      WHERE screening_id = $1
      RETURNING *
      `,
      [screening_id, JSON.stringify(questions || [])]
    );
    return result.rows[0] || null;
  }

  async markQaSent(screening_id, expired_at, schema = null) {
    const result = await getDb().query(
      `
      UPDATE screening_qa
      SET status = 'sent',
          sent_at = NOW(),
          expired_at = $2,
          application_form_schema = $3::jsonb,
          updated_at = NOW()
      WHERE screening_id = $1
      RETURNING *
      `,
      [screening_id, expired_at, schema ? JSON.stringify(schema) : null]
    );
    return result.rows[0] || null;
  }

  // Recruiter "Response Inbox" — sent/responded Q&A sets for a company, with candidate + job.
  async qaInbox(company_id) {
    const result = await getDb().query(
      `
      SELECT sq.screening_id,
             sq.status,
             sq.focus_area,
             sq.num_questions,
             sq.sent_at,
             sq.responded_at,
             sq.expired_at,
             mc.name     AS candidate_name,
             cs.candidate_id,
             cj.id       AS job_id,
             cj.job_title
      FROM screening_qa sq
      JOIN candidate_screening cs ON cs.id = sq.screening_id
      JOIN master_candidate mc    ON mc.id = cs.candidate_id
      JOIN core_job cj            ON cj.id = cs.job_id
      WHERE cs.company_id = $1
        AND sq.status IN ('sent', 'responded')
      ORDER BY COALESCE(sq.responded_at, sq.sent_at) DESC
      `,
      [company_id]
    );
    return result.rows;
  }
}

export default new ScreeningModel();
