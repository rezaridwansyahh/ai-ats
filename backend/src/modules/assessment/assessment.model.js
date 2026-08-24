import getDb from '../../config/postgres.js';

class AssessmentModel {
  /**
   * Position list + counts for the Assessment workboard — same pattern as
   * interview.model.js::getWorkboardData / screening.model.js::getWorkboardData.
   * Driven FROM core_job, LEFT JOINed down to master_candidate so a position
   * with zero candidates still shows (total: 0) instead of being dropped,
   * and stage-scoped via job_stage/recruitment_stage_category so a candidate
   * who has already moved past Assessment doesn't linger here.
   */
  async getWorkboardData(company_id) {
    const db = getDb();

    const positionRows = await db.query(
      `SELECT
         cj.id      AS job_id,
         cj.job_title,
         cj.status,
         COUNT(mc.id)                                                             AS total,
         COUNT(*) FILTER (WHERE latest_active.status IS NULL)                     AS setup,
         COUNT(*) FILTER (WHERE latest_active.status IN ('invited','in_progress')) AS take,
         COUNT(*) FILTER (WHERE latest_active.status = 'completed')               AS decide
       FROM core_job cj
       LEFT JOIN master_candidate mc ON mc.job_id = cj.id
       LEFT JOIN job_stage js ON js.id = mc.latest_stage
       LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
       LEFT JOIN LATERAL (
         SELECT s.status
         FROM assessment_sessions s
         WHERE s.candidate_id = mc.id
           AND s.job_id = mc.job_id
           AND s.status IN ('invited', 'in_progress', 'completed')
         ORDER BY
           CASE s.status WHEN 'completed' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
           s.created_at DESC
         LIMIT 1
       ) latest_active ON TRUE
       WHERE cj.company_id = $1 AND rsc.name = 'Assessment'
       GROUP BY cj.id, cj.job_title, cj.status
       ORDER BY cj.status = 'Active' DESC, cj.id ASC`,
      [company_id]
    );

    const positions = positionRows.rows.map((r) => ({
      job_id:    r.job_id,
      job_title: r.job_title,
      status:    r.status,
      total:     Number(r.total),
      setup:     Number(r.setup),
      take:      Number(r.take),
      decide:    Number(r.decide),
    }));

    const counts = positions.reduce(
      (acc, p) => {
        acc.setup  += p.setup;
        acc.take   += p.take;
        acc.decide += p.decide;
        return acc;
      },
      { setup: 0, take: 0, decide: 0 }
    );

    return { positions, counts };
  }

  /**
   * Drill-down: candidates currently in the Assessment stage for one job,
   * with the same setup/take/decide sub-step derived from their latest
   * assessment_sessions row.
   */
  async getByJobId(job_id) {
    const result = await getDb().query(
      `SELECT
         mc.id              AS candidate_id,
         mc.job_id,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.attachment,
         mc.created_at,
         a.email            AS candidate_email,
         latest_active.status AS session_status,
         CASE
           WHEN latest_active.status = 'completed' THEN 'decide'
           WHEN latest_active.status IS NOT NULL   THEN 'take'
           ELSE 'setup'
         END AS current_step
       FROM master_candidate mc
       JOIN job_stage js ON js.id = mc.latest_stage
       JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
       LEFT JOIN master_applicant a ON a.id = mc.applicant_id
       LEFT JOIN LATERAL (
         SELECT s.status
         FROM assessment_sessions s
         WHERE s.candidate_id = mc.id
           AND s.job_id = mc.job_id
           AND s.status IN ('invited', 'in_progress', 'completed')
         ORDER BY
           CASE s.status WHEN 'completed' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
           s.created_at DESC
         LIMIT 1
       ) latest_active ON TRUE
       WHERE mc.job_id = $1 AND rsc.name = 'Assessment'
       ORDER BY mc.created_at DESC`,
      [job_id]
    );
    return result.rows;
  }
}

export default new AssessmentModel();
