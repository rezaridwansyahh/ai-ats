import getDb from '../../config/postgres.js';

class InterviewModel {
  async ensureInterviewForCandidate(candidate_id) {
    const db = getDb();

    const existing = await db.query(
      `SELECT * FROM candidate_interview WHERE candidate_id = $1`,
      [candidate_id]
    );
    if (existing.rows[0]) return existing.rows[0];

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

    const { job_id, company_id } = meta.rows[0];

    const inserted = await db.query(
      `INSERT INTO candidate_interview
         (candidate_id, job_id, company_id, status, round)
       VALUES ($1, $2, $3, 'setup', 1)
       ON CONFLICT (candidate_id, job_id) DO UPDATE
         SET updated_at = NOW()
       RETURNING *`,
      [candidate_id, job_id, company_id || null]
    );
    const interview = inserted.rows[0];

    // First round is created alongside the interview record itself.
    if (!interview.current_round_id) {
      const round = await db.query(
        `INSERT INTO interview_round (interview_id, round_number, status)
         VALUES ($1, 1, 'setup')
         ON CONFLICT (interview_id, round_number) DO NOTHING
         RETURNING *`,
        [interview.id]
      );
      const roundId = round.rows[0]?.id ?? (
        await db.query(
          `SELECT id FROM interview_round WHERE interview_id = $1 AND round_number = 1`,
          [interview.id]
        )
      ).rows[0]?.id;

      if (roundId) {
        const updated = await db.query(
          `UPDATE candidate_interview SET current_round_id = $2, updated_at = NOW()
           WHERE id = $1 RETURNING *`,
          [interview.id, roundId]
        );
        return updated.rows[0];
      }
    }

    return interview;
  }

  // Returns the interview_round row the candidate_interview is currently
  // pointed at. Should always exist once ensureInterviewForCandidate has run.
  async getActiveRound(interview_id) {
    const result = await getDb().query(
      `SELECT ir.*
         FROM candidate_interview ci
         JOIN interview_round ir ON ir.id = ci.current_round_id
        WHERE ci.id = $1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  // Starts a brand new round for this interview ("Interview Again"):
  // bumps the round counter, creates a fresh interview_round row, and resets
  // status/decision so the candidate re-enters the Schedule sub-stage.
  // Prior rounds' schedule + scorecard rows are left completely untouched.
  async startNextRound(interview_id) {
    const db = getDb();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const ciRes = await client.query(
        `SELECT * FROM candidate_interview WHERE id = $1 FOR UPDATE`,
        [interview_id]
      );
      const ci = ciRes.rows[0];
      if (!ci) throw { status: 404, message: 'Interview not found' };

      const nextRoundNumber = (ci.round || 1) + 1;

      const roundRes = await client.query(
        `INSERT INTO interview_round (interview_id, round_number, status)
         VALUES ($1, $2, 'setup')
         RETURNING *`,
        [interview_id, nextRoundNumber]
      );
      const newRound = roundRes.rows[0];

      const updated = await client.query(
        `UPDATE candidate_interview
            SET round             = $2,
                current_round_id  = $3,
                status            = 'setup',
                scheduled_at      = NULL,
                decision          = 'pending',
                reject_reason     = NULL,
                reject_note       = NULL,
                decided_by        = NULL,
                decided_at        = NULL,
                updated_at        = NOW()
          WHERE id = $1
          RETURNING *`,
        [interview_id, nextRoundNumber, newRound.id]
      );

      await client.query('COMMIT');
      return { interview: updated.rows[0], round: newRound };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getById(interview_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.company_id,
         ci.status,
         ci.scheduled_at,
         ci.decision,
         ci.reject_reason,
         ci.reject_note,
         ci.decided_by,
         ci.decided_at,
         ci.created_at,
         ci.updated_at,
         ci.custom_questions,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.address,
         mc.education       AS education_text,
         mc.attachment,
         cj.job_title,
         cj.job_location,
         cj.work_type,
         cj.work_option,
         cj.seniority_level,
         cj.required_skills,
         cj.preferred_skills,
         ipp.id             AS prep_id,
         ipp.questions,
         ipp.rubric_items
       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       JOIN core_job cj          ON cj.id = ci.job_id
       LEFT JOIN interview_position_prep ipp ON ipp.job_id = ci.job_id
       WHERE ci.id = $1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  async getCandidateByJob(job_id) {
    const result = await getDb().query(
      `
      SELECT
        mc.id          AS candidate_id,
        mc.applicant_id,
        mc.job_id,
        mc.name        AS candidate_name,
        mc.last_position,
        mc.address,
        mc.date         AS applied_at,
        ci.id         AS interview_id,
        ci.decision
      FROM master_candidate mc
      LEFT JOIN candidate_interview ci ON ci.candidate_id = mc.id
      left join job_stage js on js.id = mc.latest_stage
      left join recruitment_stage_category rsc on rsc.id = js.stage_type_id
      WHERE mc.job_id = $1 AND mc.applicant_id IS NOT NULL AND rsc.name = 'Interview'
      ORDER BY mc.created_at DESC
      `, [job_id]
    );

    return result.rows || null;
  }

  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.status,
         ci.scheduled_at,
         ci.decision,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.address
       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       WHERE ci.job_id = $1
       ORDER BY ci.created_at ASC`,
      [job_id]
    );
    return result.rows;
  }

  async updateInterviewStatus(interview_id, status) {
    const result = await getDb().query(
      `UPDATE candidate_interview
          SET status     = $2,
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [interview_id, status]
    );
    return result.rows[0] || null;
  }

  // Recomputes candidate_interview.status from the CURRENT round's schedules
  // only — history from prior rounds must never influence the live status.
  //   no schedules in round            -> setup
  //   a confirmed future schedule      -> ongoing
  //   any (unconfirmed) schedule       -> scheduled
  async syncScheduledAt(interview_id) {
    const result = await getDb().query(
      `UPDATE candidate_interview ci
          SET scheduled_at = (
                SELECT MIN(s.scheduled_at)
                FROM interview_schedule s
                WHERE s.round_id = ci.current_round_id
                  AND s.confirmed = false
                  AND s.scheduled_at >= NOW()
              ),
              status = CASE
                WHEN EXISTS (
                  SELECT 1 FROM interview_schedule s
                  WHERE s.round_id = ci.current_round_id AND s.confirmed = true
                ) THEN 'ongoing'
                WHEN EXISTS (
                  SELECT 1 FROM interview_schedule s
                  WHERE s.round_id = ci.current_round_id
                ) THEN 'scheduled'
                ELSE 'setup'
              END,
              updated_at = NOW()
        WHERE ci.id = $1
        RETURNING *`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  async getWorkboardData(company_id) {
    const db = getDb();

    const positionRows = await db.query(
      `SELECT
         cj.id      AS job_id,
         cj.job_title,
         cj.status,
         COUNT(ci.id)                                                   AS total,
         COUNT(*) FILTER (WHERE ci.status = 'setup')                    AS setup,
         COUNT(*) FILTER (WHERE ci.status = 'scheduled')                AS scheduled,
         COUNT(*) FILTER (WHERE ci.status = 'ongoing')                  AS ongoing,
         COUNT(*) FILTER (WHERE ci.status = 'result')                   AS result,
         COUNT(*) FILTER (WHERE ci.status = 'done')                     AS done,
         COUNT(*) FILTER (WHERE ci.status IN ('setup','scheduled','ongoing')) AS schedule_count,
         COUNT(*) FILTER (WHERE ci.status = 'result')                   AS result_count,
         COUNT(*) FILTER (WHERE ci.status = 'done')                     AS decide_count,
         ipp.pack_token,
         (
           ipp.rubric_items IS NOT NULL
           AND jsonb_array_length(ipp.rubric_items) > 0
           AND ipp.questions IS NOT NULL
           AND jsonb_array_length(ipp.questions) > 0
         ) AS prep_ready
       FROM core_job cj
       LEFT JOIN candidate_interview ci ON ci.job_id = cj.id
       LEFT JOIN master_candidate mc ON mc.id = ci.candidate_id
       LEFT JOIN job_stage js ON js.id = mc.latest_stage
       LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
       LEFT JOIN interview_position_prep ipp ON ipp.job_id = cj.id
       WHERE cj.company_id = $1 AND rsc.name = 'Interview'
       GROUP BY cj.id, cj.job_title, cj.status, ipp.pack_token, ipp.rubric_items, ipp.questions
       ORDER BY cj.status = 'Active' DESC, cj.id ASC`,
      [company_id]
    );

    const positions = positionRows.rows.map((r) => ({
      job_id:         r.job_id,
      job_title:      r.job_title,
      status:         r.status,
      total:          Number(r.total),
      setup:          Number(r.setup),
      scheduled:      Number(r.scheduled),
      ongoing:        Number(r.ongoing),
      result:         Number(r.result),
      done:           Number(r.done),
      schedule_count: Number(r.schedule_count),
      result_count:   Number(r.result_count),
      decide_count:   Number(r.decide_count),
      pack_token:     r.pack_token || null,
      prep_ready:     r.prep_ready === true || r.prep_ready === 'true',
    }));

    const counts = positions.reduce(
      (acc, p) => {
        acc.setup     += p.setup;
        acc.scheduled += p.scheduled;
        acc.ongoing   += p.ongoing;
        acc.result    += p.result;
        acc.done      += p.done;
        return acc;
      },
      { setup: 0, scheduled: 0, ongoing: 0, result: 0, done: 0 }
    );

    return { counts, positions };
  }

  // Current round's sessions only — what the Schedule tab shows/counts against.
  async getSchedulesByInterview(interview_id) {
    const result = await getDb().query(
      `SELECT s.*
         FROM interview_schedule s
         JOIN candidate_interview ci ON ci.current_round_id = s.round_id
        WHERE ci.id = $1
        ORDER BY s.scheduled_at ASC`,
      [interview_id]
    );
    return result.rows;
  }

  // Full history across every round — for an eventual "past rounds" view.
  async getScheduleHistory(interview_id) {
    const result = await getDb().query(
      `SELECT s.*, ir.round_number
         FROM interview_schedule s
         JOIN interview_round ir ON ir.id = s.round_id
        WHERE s.interview_id = $1
        ORDER BY ir.round_number ASC, s.scheduled_at ASC`,
      [interview_id]
    );
    return result.rows;
  }

  async getScheduleById(schedule_id) {
    const result = await getDb().query(
      `SELECT * FROM interview_schedule WHERE id = $1`,
      [schedule_id]
    );
    return result.rows[0] || null;
  }

  // Scoped to the CURRENT round only, so a new round always starts fresh
  // against the MAX_SESSIONS cap.
  async countSchedules(interview_id) {
    const result = await getDb().query(
      `SELECT COUNT(*) AS count
         FROM interview_schedule s
         JOIN candidate_interview ci ON ci.current_round_id = s.round_id
        WHERE ci.id = $1`,
      [interview_id]
    );
    return Number(result.rows[0].count);
  }

  // True when the current round already has a schedule that hasn't been
  // resolved yet (no outcome recorded), OR the latest resolved outcome was
  // NOT 'reschedule'. Only a fresh round or a 'reschedule' outcome allows
  // adding another session — everything else must go through startNextRound.
  async isScheduleCreationLocked(interview_id) {
    const result = await getDb().query(
      `SELECT s.status, s.confirmed
         FROM interview_schedule s
         JOIN candidate_interview ci ON ci.current_round_id = s.round_id
        WHERE ci.id = $1
        ORDER BY s.created_at DESC
        LIMIT 1`,
      [interview_id]
    );
    const latest = result.rows[0];
    if (!latest) return false; // no sessions yet in this round — free to add
    if (latest.status === 'reschedule') return false; // explicitly allowed to rebook
    return true; // either unresolved, or resolved with a terminal outcome
  }

  async createSchedule({ interview_id, company_id, title, description, scheduled_at, created_by }) {
    const round = await this.getActiveRound(interview_id);
    if (!round) throw { status: 400, message: 'No active interview round found' };

    const result = await getDb().query(
      `INSERT INTO interview_schedule
         (interview_id, round_id, company_id, title, description, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [interview_id, round.id, company_id || null, title, description || null, scheduled_at, created_by || null]
    );
    return result.rows[0];
  }

  async updateSchedule(schedule_id, fields) {
    const keys   = Object.keys(fields).filter((k) => fields[k] !== undefined);
    const values = keys.map((k) => fields[k]);
    if (keys.length === 0) throw new Error('No fields provided for update');
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const result = await getDb().query(
      `UPDATE interview_schedule SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, schedule_id]
    );
    return result.rows[0] || null;
  }

  async confirmSchedule(schedule_id, { confirmed_by, confirmation_note }) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET confirmed = true, confirmed_at = NOW(), confirmed_by = $2,
              confirmation_note = $3, updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [schedule_id, confirmed_by || null, confirmation_note || null]
    );
    const schedule = result.rows[0] || null;
    if (schedule?.round_id) {
      await getDb().query(
        `UPDATE interview_round SET status = 'ongoing', updated_at = NOW() WHERE id = $1`,
        [schedule.round_id]
      );
    }
    return schedule;
  }

  async unconfirmSchedule(schedule_id) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET confirmed = false, confirmed_at = NULL, confirmed_by = NULL,
              confirmation_note = NULL, updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [schedule_id]
    );
    const schedule = result.rows[0] || null;
    if (schedule?.round_id) {
      await getDb().query(
        `UPDATE interview_round SET status = 'scheduled', updated_at = NOW() WHERE id = $1`,
        [schedule.round_id]
      );
    }
    return schedule;
  }

  async deleteSchedule(schedule_id) {
    const result = await getDb().query(
      `DELETE FROM interview_schedule WHERE id = $1 RETURNING *`,
      [schedule_id]
    );
    return result.rows[0] || null;
  }

  async recordOutcome(schedule_id, { status, outcome_note }) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET status = $2, outcome_note = $3, outcome_at = NOW(), updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [schedule_id, status, outcome_note || null]
    );
    const schedule = result.rows[0] || null;
    if (schedule?.round_id) {
      await getDb().query(
        `UPDATE interview_round SET status = $2, updated_at = NOW() WHERE id = $1`,
        [schedule.round_id, status === 'reschedule' ? 'scheduled' : 'result']
      );
    }
    return schedule;
  }

  async clearOutcome(schedule_id) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET status = 'ongoing', outcome_note = NULL, outcome_at = NULL, updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [schedule_id]
    );
    const schedule = result.rows[0] || null;
    if (schedule?.round_id) {
      await getDb().query(
        `UPDATE interview_round SET status = 'ongoing', updated_at = NOW() WHERE id = $1`,
        [schedule.round_id]
      );
    }
    return schedule;
  }

  // Current round's scorecard only.
  async getScorecardByInterview(interview_id) {
    const result = await getDb().query(
      `SELECT sc.*
         FROM interview_scorecard sc
         JOIN candidate_interview ci ON ci.current_round_id = sc.round_id
        WHERE ci.id = $1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  // Full scorecard history across every round.
  async getScorecardHistory(interview_id) {
    const result = await getDb().query(
      `SELECT sc.*, ir.round_number
         FROM interview_scorecard sc
         JOIN interview_round ir ON ir.id = sc.round_id
        WHERE sc.interview_id = $1
        ORDER BY ir.round_number ASC`,
      [interview_id]
    );
    return result.rows;
  }

  async upsertScorecard({
    interview_id, company_id,
    competency_scores, competency_comments,
    recommendation, standout_strengths, concerns,
    rubric_items, submitted_by, is_draft,
  }) {
    const round = await this.getActiveRound(interview_id);
    if (!round) throw { status: 400, message: 'No active interview round found' };
    let weightedSum = 0;
    let totalWeight = 0;
    let review_flag = false;

    if (rubric_items && typeof competency_scores === 'object') {
      for (const item of rubric_items) {
        const score  = Number(competency_scores[item.competency_code]);
        const weight = Number(item.weight) || 1;
        if (Number.isFinite(score)) {
          weightedSum += score * weight;
          totalWeight += weight;
          if (score <= 2) review_flag = true;
        }
      }
    }

    const weighted_total = totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100) / 100
      : null;

    const submitted_at = is_draft === false ? 'NOW()' : null;

    const result = await getDb().query(
      `INSERT INTO interview_scorecard
        (interview_id, round_id, company_id,
          competency_scores, competency_comments,
          weighted_total, review_flag,
          recommendation, standout_strengths, concerns,
          submitted_by, submitted_at, is_draft)
      VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,
              ${submitted_at ? 'NOW()' : 'NULL'}, $12)
      ON CONFLICT (round_id) DO UPDATE SET
        competency_scores   = EXCLUDED.competency_scores,
        competency_comments = EXCLUDED.competency_comments,
        weighted_total      = EXCLUDED.weighted_total,
        review_flag         = EXCLUDED.review_flag,
        recommendation      = EXCLUDED.recommendation,
        standout_strengths  = EXCLUDED.standout_strengths,
        concerns            = EXCLUDED.concerns,
        submitted_by        = EXCLUDED.submitted_by,
        submitted_at        = CASE
                                WHEN interview_scorecard.is_draft = true AND $12 = false
                                THEN NOW()
                                ELSE interview_scorecard.submitted_at
                              END,
        is_draft            = EXCLUDED.is_draft,
        updated_at          = NOW()
      RETURNING *`,
      [
        interview_id, round.id, company_id || null,
        JSON.stringify(competency_scores   || {}),
        JSON.stringify(competency_comments || {}),
        weighted_total, review_flag,
        recommendation || null, standout_strengths || null, concerns || null,
        submitted_by   || null,
        is_draft !== false,
      ]
    );

    // Mirror onto interview_round so history queries show final round status.
    if (is_draft === false) {
      await getDb().query(
        `UPDATE interview_round SET status = 'done', updated_at = NOW() WHERE id = $1`,
        [round.id]
      );
    }

    return result.rows[0];
  }

  // Deletes the CURRENT round's scorecard only — never touches history.
  async deleteScorecard(interview_id) {
    const result = await getDb().query(
      `DELETE FROM interview_scorecard sc
        USING candidate_interview ci
       WHERE ci.id = $1 AND ci.current_round_id = sc.round_id
       RETURNING sc.*`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  async upsertRubricOnly(job_id, company_id, rubric_items, created_by) {
    const result = await getDb().query(
      `INSERT INTO interview_position_prep (job_id, company_id, questions, rubric_items, created_by)
      VALUES ($1, $2, '[]'::jsonb, $3::jsonb, $4)
      ON CONFLICT (job_id) DO UPDATE SET
        rubric_items = EXCLUDED.rubric_items,
        updated_at   = NOW()
      RETURNING *`,
      [job_id, company_id || null, JSON.stringify(rubric_items), created_by || null]
    );
    return result.rows[0] || null;
  }

  async hasSubmittedScorecardsByJob(job_id) {
    const result = await getDb().query(
      `SELECT EXISTS (
         SELECT 1 FROM interview_scorecard isc
         JOIN candidate_interview ci ON ci.current_round_id = isc.round_id
         WHERE ci.job_id = $1 AND isc.is_draft = false
       ) AS has_submitted`,
      [job_id]
    );
    return result.rows[0]?.has_submitted === true;
  }

  async getDecideByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.status,
         ci.round,
         ci.decision,
         ci.reject_reason,
         ci.reject_note,
         ci.decided_at,
         ci.decided_by,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.education,
         isc.weighted_total,
         isc.competency_scores,
         isc.review_flag,
         isc.recommendation,
         isc.standout_strengths,
         isc.concerns,
         isc.is_draft,
         ipp.rubric_items
       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       LEFT JOIN interview_scorecard isc ON isc.round_id = ci.current_round_id
       LEFT JOIN interview_position_prep ipp ON ipp.job_id = ci.job_id
       WHERE ci.job_id = $1
       ORDER BY isc.weighted_total DESC NULLS LAST`,
      [job_id]
    );
    return result.rows;
  }

  // Single-candidate decide — used by the candidate detail page's
  // Advance/Reject buttons. Scoped strictly to one candidate_interview row
  // by primary key; does not touch decisions[] arrays or loops at all.
  async decideOne(interview_id, { decision, reject_reason, reject_note, decided_by }) {
    const result = await getDb().query(
      `UPDATE candidate_interview
          SET decision      = $2,
              reject_reason = $3,
              reject_note   = $4,
              decided_at    = NOW(),
              decided_by    = $5,
              status        = 'done',
              updated_at    = NOW()
        WHERE id = $1
        RETURNING *`,
      [interview_id, decision, reject_reason ?? null, reject_note ?? null, decided_by ?? null]
    );
    return result.rows[0] || null;
  }

  // Advance/reject are terminal for the current round — status flips to
  // 'done' alongside the decision so the candidate settles in the Decide
  // sub-stage. (Interview Again handles its own status reset separately,
  // via startNextRound — it never goes through bulkDecide.)
  async bulkDecide(job_id, decisions, decided_by) {
    const db     = getDb();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const decidedAt = new Date();
      for (const d of decisions) {
        await client.query(
          `UPDATE candidate_interview
              SET decision      = $1,
                  reject_reason = $2,
                  reject_note   = $3,
                  decided_at    = $4,
                  decided_by    = $5,
                  status        = 'done',
                  updated_at    = NOW()
            WHERE id = $6 AND job_id = $7`,
          [d.decision, d.reject_reason ?? null, d.reject_note ?? null, decidedAt, decided_by, d.candidateInterviewId, job_id]
        );
      }
      await client.query('COMMIT');
      return { updated: decisions.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async resetDecision(job_id, candidateInterviewId) {
    const result = await getDb().query(
      `UPDATE candidate_interview
          SET decision      = 'pending',
              reject_reason = NULL,
              reject_note   = NULL,
              decided_at    = NULL,
              decided_by    = NULL,
              updated_at    = NOW()
        WHERE id = $1 AND job_id = $2
        RETURNING *`,
      [candidateInterviewId, job_id]
    );
    return result.rows[0] || null;
  }

  async getCalibrationData(job_id, company_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.round,
         ci.decision,
         ci.reject_reason,
         ci.reject_note,
         ci.decided_at,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.address,
         mc.education       AS education_text,
         isc.weighted_total AS overall_score,
         isc.recommendation,
         isc.standout_strengths,
         isc.concerns,
         isc.submitted_at,
         isc.is_draft
       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       LEFT JOIN interview_scorecard isc ON isc.round_id = ci.current_round_id
       WHERE ci.job_id = $1
         AND ci.company_id = $2
       ORDER BY isc.weighted_total DESC NULLS LAST, mc.name ASC`,
      [job_id, company_id]
    );
    return result.rows;
  }

  async batchRecordDecisions(decisions, company_id) {
    const results = [];
    for (const dec of decisions) {
      const result = await getDb().query(
        `UPDATE candidate_interview
            SET decision      = $2,
                reject_reason = $3,
                reject_note   = $4,
                decided_by    = $5,
                decided_at    = NOW(),
                updated_at    = NOW()
          WHERE id = $1
            AND company_id = $6
          RETURNING *`,
        [
          dec.interview_id,
          dec.decision,
          dec.reject_reason || null,
          dec.reject_note   || null,
          dec.decided_by    || null,
          company_id,
        ]
      );
      if (result.rows[0]) results.push(result.rows[0]);
    }
    return results;
  }

  async getPrepByJob(job_id) {
    const result = await getDb().query(
      `SELECT * FROM interview_position_prep WHERE job_id = $1`,
      [job_id]
    );
    return result.rows[0] || null;
  }

  async upsertPrep({ job_id, company_id, questions, rubric_items, created_by }) {
    const result = await getDb().query(
      `INSERT INTO interview_position_prep
         (job_id, company_id, questions, rubric_items, created_by)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
       ON CONFLICT (job_id) DO UPDATE SET
         questions        = EXCLUDED.questions,
         rubric_items     = EXCLUDED.rubric_items,
         updated_at       = NOW()
       RETURNING *`,
      [job_id, company_id || null, JSON.stringify(questions || []), JSON.stringify(rubric_items || []), created_by || null]
    );
    return result.rows[0];
  }

  async updatePrepQuestions(job_id, questions) {
    const result = await getDb().query(
      `UPDATE interview_position_prep SET questions = $2::jsonb, updated_at = NOW() WHERE job_id = $1 RETURNING *`,
      [job_id, JSON.stringify(questions || [])]
    );
    return result.rows[0] || null;
  }

  async updatePrepRubric(job_id, rubric_items) {
    const result = await getDb().query(
      `UPDATE interview_position_prep SET rubric_items = $2::jsonb, updated_at = NOW() WHERE job_id = $1 RETURNING *`,
      [job_id, JSON.stringify(rubric_items || [])]
    );
    return result.rows[0] || null;
  }

  async updateCandidateQuestions(interview_id, custom_questions) {
    await getDb().query(
      `UPDATE candidate_interview
      SET custom_questions = $1, updated_at = NOW()
      WHERE id = $2`,
      [JSON.stringify(custom_questions ?? []), interview_id]
    );
  }

  async storePrepPackToken(job_id, pack_token) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET pack_token = $2, updated_at = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, pack_token]
    );
    return result.rows[0] || null;
  }

  async getPackOutcomeForInterview(interview_id) {
    const result = await getDb().query(
      `SELECT
         ipo.*,
         ip.title           AS pack_title,
         ip.interviewer_name,
         ip.submitted_at,
         ip.token           AS pack_token,
         ip.status          AS pack_status
       FROM candidate_interview ci
       JOIN master_candidate mc         ON mc.id  = ci.candidate_id
       JOIN interview_pack_candidate ipc ON ipc.applicant_id = mc.applicant_id
       JOIN interview_pack ip           ON ip.id  = ipc.pack_id
                                        AND ip.job_id = ci.job_id
       JOIN interview_pack_outcome ipo  ON ipo.pack_candidate_id = ipc.id
       WHERE ci.id = $1
       ORDER BY ipo.updated_at DESC
       LIMIT 1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  // Every round this interview has been through, each with its outcome if
  // one exists yet — powers the Result AND Decide tabs' per-round dropdown.
  // A round's outcome can come from either scoring path:
  //   - direct in-app Evaluate scorecard (interview_scorecard, HRD-codes)
  //   - pack-link portal submission      (interview_pack_outcome, free-text criteria)
  // Direct scorecard wins if both somehow exist for the same round.
    async getRoundsWithOutcomes(interview_id) {
    const result = await getDb().query(
      `SELECT DISTINCT ON (ir.round_number)
         ir.round_number,
         ir.status              AS round_status,
         sc.id                  AS scorecard_id,
         sc.competency_scores,
         sc.weighted_total      AS sc_weighted_total,
         sc.recommendation      AS sc_recommendation,
         sc.standout_strengths  AS sc_strengths,
         sc.concerns            AS sc_concerns,
         sc.is_draft            AS sc_is_draft,
         ipo.id                 AS outcome_id,
         ipo.scores             AS pack_scores,
         ipo.weighted_total     AS pack_weighted_total,
         ipo.recommendation     AS pack_recommendation,
         ipo.strengths          AS pack_strengths,
         ipo.concerns           AS pack_concerns,
         ipo.question_notes     AS pack_question_notes,
         ipo.updated_at         AS outcome_updated_at,
         ip.interviewer_name,
         ip.submitted_at,
         ip.token               AS pack_token,
         ip.status              AS pack_status,
         ip.questions_snapshot  AS pack_questions_snapshot
       FROM interview_round ir
       LEFT JOIN interview_scorecard sc        ON sc.round_id = ir.id
       LEFT JOIN interview_pack_candidate ipc  ON ipc.round_id = ir.id
       LEFT JOIN interview_pack ip             ON ip.id = ipc.pack_id
       LEFT JOIN interview_pack_outcome ipo    ON ipo.pack_candidate_id = ipc.id
       WHERE ir.interview_id = $1
       ORDER BY ir.round_number ASC, ipo.updated_at DESC NULLS LAST`,
      [interview_id]
    );

    const maxRound = result.rows.reduce((m, r) => Math.max(m, r.round_number), 1);

    return result.rows.map((r) => {
      const hasDirect = r.scorecard_id && r.sc_is_draft === false;
      const hasPack   = !hasDirect && r.outcome_id;

      let outcome = null;
      if (hasDirect) {
        outcome = {
          source:           'direct',
          scores:            r.competency_scores,
          weighted_total:    r.sc_weighted_total,
          recommendation:    r.sc_recommendation,
          strengths:         r.sc_strengths,
          concerns:          r.sc_concerns,
        };
      } else if (hasPack) {
        outcome = {
          source:            'pack',
          scores:             r.pack_scores,
          weighted_total:     r.pack_weighted_total,
          recommendation:     r.pack_recommendation,
          strengths:          r.pack_strengths,
          concerns:           r.pack_concerns,
          interviewer_name:   r.interviewer_name,
          submitted_at:       r.submitted_at,
          pack_token:         r.pack_token,
          pack_status:        r.pack_status,
          questions_snapshot: r.pack_questions_snapshot,
          question_notes:     r.pack_question_notes,
        };
      }

      return {
        round_number: r.round_number,
        round_status: r.round_status,
        is_current:   r.round_number === maxRound,
        outcome,
      };
    });
  }

  // Driven from master_candidate (source of truth for "who is currently in
  // Interview"), LEFT JOINed to candidate_interview for detail fields. A
  // candidate whose latest_stage has since moved past Interview no longer
  // matches, even if a stale candidate_interview row still exists for them.
  async getInterviewsByJobWithSubStage(job_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         mc.id              AS candidate_id,
         mc.job_id,
         COALESCE(ci.status, 'setup') AS status,
         ci.round,
         ci.scheduled_at,
         ci.decision,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.address,
         mc.applicant_id,
         CASE
           WHEN ci.status IN ('setup','scheduled','ongoing') THEN 'schedule'
           WHEN ci.status = 'result' THEN 'result'
           WHEN ci.status = 'done' THEN 'decide'
           ELSE 'schedule'
         END AS sub_stage,
         CASE
           WHEN ci.status IS DISTINCT FROM 'result' THEN NULL
           WHEN scored_pack.id IS NOT NULL THEN 'scored'
           WHEN open_pack.id   IS NOT NULL THEN 'in_pack'
           ELSE 'waiting'
         END AS result_state,
         open_pack.id    AS pack_id,
         open_pack.token AS pack_token
       FROM master_candidate mc
       JOIN job_stage js ON js.id = mc.latest_stage
       JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
       LEFT JOIN candidate_interview ci ON ci.candidate_id = mc.id AND ci.job_id = mc.job_id
       LEFT JOIN LATERAL (
         SELECT ip.id, ip.token
         FROM interview_pack_candidate ipc
         JOIN interview_pack ip ON ip.id = ipc.pack_id
         WHERE ipc.applicant_id = mc.applicant_id
           AND ip.job_id = mc.job_id
           AND ip.status = 'open'
         LIMIT 1
       ) open_pack ON true
       LEFT JOIN LATERAL (
         SELECT ip.id
         FROM interview_pack_candidate ipc
         JOIN interview_pack ip ON ip.id = ipc.pack_id
         JOIN interview_pack_outcome ipo ON ipo.pack_candidate_id = ipc.id
         WHERE ipc.applicant_id = mc.applicant_id
           AND ip.job_id = mc.job_id
         LIMIT 1
       ) scored_pack ON true
       WHERE mc.job_id = $1 AND rsc.name = 'Interview'
       ORDER BY mc.created_at ASC`,
      [job_id]
    );
    return result.rows;
  }

  async getPrepContext(job_id) {
    const result = await getDb().query(
      `SELECT
         ipp.id, ipp.job_id, ipp.company_id, ipp.questions, ipp.rubric_items,
         ipp.created_by, ipp.created_at, ipp.updated_at,
         cj.job_title, cj.job_desc, cj.job_location, cj.work_type,
         cj.seniority_level, cj.required_skills, cj.preferred_skills, cj.qualifications
       FROM interview_position_prep ipp
       JOIN core_job cj ON cj.id = ipp.job_id
       WHERE ipp.job_id = $1`,
      [job_id]
    );
    return result.rows[0] || null;
  }
}

export default new InterviewModel();