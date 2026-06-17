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
      `SELECT mc.job_id, cj.company_id, cs.id AS screening_id
         FROM master_candidate mc
         LEFT JOIN core_job cj ON cj.id = mc.job_id
         LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
        WHERE mc.id = $1`,
      [candidate_id]
    );
    if (!meta.rows[0]) {
      throw { status: 404, message: `master_candidate ${candidate_id} not found` };
    }

    const { job_id, company_id, screening_id } = meta.rows[0];

    const inserted = await db.query(
      `INSERT INTO candidate_interview
         (candidate_id, job_id, screening_id, company_id, status)
       VALUES ($1, $2, $3, $4, 'ongoing')
       ON CONFLICT (candidate_id, job_id) DO UPDATE
         SET screening_id = EXCLUDED.screening_id,
             updated_at   = NOW()
       RETURNING *`,
      [candidate_id, job_id, screening_id || null, company_id || null]
    );
    return inserted.rows[0];
  }

  async getById(interview_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.screening_id,
         ci.company_id,
         ci.status,
         ci.scheduled_at,
         ci.created_at,
         ci.updated_at,

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
         ipp.rubric_items,
         ipp.rubric_locked

       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       JOIN core_job cj          ON cj.id = ci.job_id
       LEFT JOIN interview_position_prep ipp ON ipp.job_id = ci.job_id
       WHERE ci.id = $1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.status,
         ci.scheduled_at,
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

  async syncScheduledAt(interview_id) {
    const result = await getDb().query(
      `UPDATE candidate_interview
          SET scheduled_at = (
                SELECT MIN(scheduled_at)
                FROM interview_schedule
                WHERE interview_id = $1
                  AND confirmed = false
                  AND scheduled_at >= NOW()
              ),
              status = CASE
                WHEN EXISTS (
                  SELECT 1 FROM interview_schedule
                  WHERE interview_id = $1
                ) THEN 'scheduled'
                ELSE status
              END,
              updated_at = NOW()
        WHERE id = $1
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
         COUNT(*) FILTER (WHERE ci.status = 'ongoing')                 AS ongoing,
         COUNT(*) FILTER (WHERE ci.status = 'scheduled')               AS scheduled,
         COUNT(*) FILTER (WHERE ci.status = 'interviewed')             AS interviewed,
         COUNT(*) FILTER (WHERE ci.status = 'no_show')                 AS no_show,
         COUNT(*) FILTER (WHERE ci.status = 'reschedule')              AS reschedule,
         COUNT(*) FILTER (WHERE ci.status = 'done')                    AS done
       FROM core_job cj
       LEFT JOIN candidate_interview ci ON ci.job_id = cj.id
       WHERE cj.company_id = $1
       GROUP BY cj.id, cj.job_title, cj.status
       ORDER BY cj.status = 'Active' DESC, cj.id ASC`,
      [company_id]
    );

    const positions = positionRows.rows.map((r) => ({
      job_id:      r.job_id,
      job_title:   r.job_title,
      status:      r.status,
      total:       Number(r.total),
      ongoing:     Number(r.ongoing),
      scheduled:   Number(r.scheduled),
      interviewed: Number(r.interviewed),
      no_show:     Number(r.no_show),
      reschedule:  Number(r.reschedule),
      done:        Number(r.done),
    }));

    const counts = positions.reduce(
      (acc, p) => {
        acc.ongoing     += p.ongoing;
        acc.scheduled   += p.scheduled;
        acc.interviewed += p.interviewed;
        acc.no_show     += p.no_show;
        acc.reschedule  += p.reschedule;
        acc.done        += p.done;
        return acc;
      },
      { ongoing: 0, scheduled: 0, interviewed: 0, no_show: 0, reschedule: 0, done: 0 }
    );

    return { counts, positions };
  }

  async getSchedulesByInterview(interview_id) {
    const result = await getDb().query(
      `SELECT * FROM interview_schedule
       WHERE interview_id = $1
       ORDER BY scheduled_at ASC`,
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

  async countSchedules(interview_id) {
    const result = await getDb().query(
      `SELECT COUNT(*) FROM interview_schedule WHERE interview_id = $1`,
      [interview_id]
    );
    return Number(result.rows[0].count);
  }

  async createSchedule({ interview_id, company_id, title, description, scheduled_at, created_by }) {
    const result = await getDb().query(
      `INSERT INTO interview_schedule
         (interview_id, company_id, title, description, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        interview_id,
        company_id  || null,
        title,
        description || null,
        scheduled_at,
        created_by  || null,
      ]
    );
    return result.rows[0];
  }

  async updateSchedule(schedule_id, fields) {
    const keys   = Object.keys(fields).filter((k) => fields[k] !== undefined);
    const values = keys.map((k) => fields[k]);

    if (keys.length === 0) throw new Error('No fields provided for update');

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');

    const result = await getDb().query(
      `UPDATE interview_schedule
          SET ${setClause}, updated_at = NOW()
        WHERE id = $${keys.length + 1}
        RETURNING *`,
      [...values, schedule_id]
    );
    return result.rows[0] || null;
  }

  async confirmSchedule(schedule_id, { confirmed_by, confirmation_note }) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET confirmed         = true,
              confirmed_at      = NOW(),
              confirmed_by      = $2,
              confirmation_note = $3,
              updated_at        = NOW()
        WHERE id = $1
        RETURNING *`,
      [schedule_id, confirmed_by || null, confirmation_note || null]
    );
    return result.rows[0] || null;
  }

  async unconfirmSchedule(schedule_id) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET confirmed         = false,
              confirmed_at      = NULL,
              confirmed_by      = NULL,
              confirmation_note = NULL,
              updated_at        = NOW()
        WHERE id = $1
        RETURNING *`,
      [schedule_id]
    );
    return result.rows[0] || null;
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
          SET status       = $2,
              outcome_note = $3,
              outcome_at   = NOW(),
              updated_at   = NOW()
        WHERE id = $1
        RETURNING *`,
      [schedule_id, status, outcome_note || null]
    );
    return result.rows[0] || null;
  }

  // Clears an outcome — recruiter corrects a mistake before it matters downstream.
  async clearOutcome(schedule_id) {
    const result = await getDb().query(
      `UPDATE interview_schedule
          SET status       = 'ongoing',
              outcome_note = NULL,
              outcome_at   = NULL,
              updated_at   = NOW()
        WHERE id = $1
        RETURNING *`,
      [schedule_id]
    );
    return result.rows[0] || null;
  }

  async getScorecardByInterview(interview_id) {
    const result = await getDb().query(
      `SELECT * FROM interview_scorecard WHERE interview_id = $1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  async upsertScorecard({
    interview_id, company_id,
    competency_scores, competency_comments,
    recommendation, standout_strengths, concerns,
    rubric_items, submitted_by, is_draft,
  }) {
    let weightedSum  = 0;
    let totalWeight  = 0;
    let review_flag  = false;

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
        (interview_id, company_id,
          competency_scores, competency_comments,
          weighted_total, review_flag,
          recommendation, standout_strengths, concerns,
          submitted_by, submitted_at, is_draft)
      VALUES ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9,$10,
              ${submitted_at ? 'NOW()' : 'NULL'},
              $11)
      ON CONFLICT (interview_id) DO UPDATE SET
        competency_scores   = EXCLUDED.competency_scores,
        competency_comments = EXCLUDED.competency_comments,
        weighted_total      = EXCLUDED.weighted_total,
        review_flag         = EXCLUDED.review_flag,
        recommendation      = EXCLUDED.recommendation,
        standout_strengths  = EXCLUDED.standout_strengths,
        concerns            = EXCLUDED.concerns,
        submitted_by        = EXCLUDED.submitted_by,
        submitted_at        = CASE
                                WHEN interview_scorecard.is_draft = true AND $11 = false
                                THEN NOW()
                                ELSE interview_scorecard.submitted_at
                              END,
        is_draft            = EXCLUDED.is_draft,
        updated_at          = NOW()
      RETURNING *`,
      [
        interview_id,
        company_id      || null,
        JSON.stringify(competency_scores   || {}),
        JSON.stringify(competency_comments || {}),
        weighted_total,
        review_flag,
        recommendation       || null,
        standout_strengths   || null,
        concerns             || null,
        submitted_by         || null,
        is_draft !== false,  // default true unless explicitly false
      ]
    );
    return result.rows[0];
  }

  async deleteScorecard(interview_id) {
    const result = await getDb().query(
      `DELETE FROM interview_scorecard WHERE interview_id = $1 RETURNING *`,
      [interview_id]
    );
    return result.rows[0] || null;
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
         rubric_locked    = false,
         rubric_locked_at = NULL,
         locked_by        = NULL,
         updated_at       = NOW()
       RETURNING *`,
      [
        job_id,
        company_id || null,
        JSON.stringify(questions    || []),
        JSON.stringify(rubric_items || []),
        created_by || null,
      ]
    );
    return result.rows[0];
  }

  async updatePrepQuestions(job_id, questions) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET questions  = $2::jsonb,
              updated_at = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, JSON.stringify(questions || [])]
    );
    return result.rows[0] || null;
  }

  async updatePrepRubric(job_id, rubric_items) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET rubric_items = $2::jsonb,
              updated_at   = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, JSON.stringify(rubric_items || [])]
    );
    return result.rows[0] || null;
  }

  async lockRubric(job_id, locked_by) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET rubric_locked    = true,
              rubric_locked_at = NOW(),
              locked_by        = $2,
              updated_at       = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, locked_by || null]
    );
    return result.rows[0] || null;
  }

  async unlockRubric(job_id) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET rubric_locked    = false,
              rubric_locked_at = NULL,
              locked_by        = NULL,
              updated_at       = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id]
    );
    return result.rows[0] || null;
  }

  async getPrepContext(job_id) {
    const result = await getDb().query(
      `SELECT
         ipp.id              AS prep_id,
         ipp.job_id,
         ipp.company_id,
         ipp.questions,
         ipp.rubric_items,
         ipp.rubric_locked,
         ipp.rubric_locked_at,
         ipp.locked_by,
         ipp.created_by,
         ipp.created_at,
         ipp.updated_at,

         cj.job_title,
         cj.job_desc,
         cj.job_location,
         cj.work_type,
         cj.seniority_level,
         cj.required_skills,
         cj.preferred_skills,
         cj.qualifications
       FROM interview_position_prep ipp
       JOIN core_job cj ON cj.id = ipp.job_id
       WHERE ipp.job_id = $1`,
      [job_id]
    );
    return result.rows[0] || null;
  }
}

export default new InterviewModel();