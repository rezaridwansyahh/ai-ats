import getDb from '../../config/postgres.js';

class OfferPackModel {

  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         co.id AS offer_id,
         mc.name AS candidate_name,
         co.metadata->'approval'->>'decision' AS decision,
         co.metadata->'approval'->>'note' AS note,
         (co.metadata->'approval'->>'decided_at')::timestamptz AS decided_at,
         mu.username AS decided_by_name
       FROM candidate_offer co
       JOIN master_candidate mc ON mc.id = co.candidate_id
       LEFT JOIN master_users mu ON mu.id = (co.metadata->'approval'->>'decided_by')::int
       WHERE co.job_id = $1
       ORDER BY co.id`,
      [job_id]
    );
    return result.rows;
  }

  async getUserEmail(user_id) {
    const result = await getDb().query(
      `SELECT email FROM master_users WHERE id = $1`,
      [user_id]
    );
    return result.rows[0]?.email || null;
  }

  async getViewLinkByToken(token) {
    const result = await getDb().query(
      `SELECT
         co.id AS offer_id,
         co.metadata->'approval_view' AS approval_view,
         cj.job_title,
         cc.name AS company_name
       FROM candidate_offer co
       JOIN core_job cj ON cj.id = co.job_id
       JOIN core_company cc ON cc.id = co.company_id
       WHERE co.metadata->'approval_view'->>'token' = $1`,
      [token]
    );
    return result.rows[0] || null;
  }

  async getSummaryByOfferId(offer_id) {
    const result = await getDb().query(
      `SELECT
         co.position_title,
         co.metadata->'intake'->'slip_gaji' AS slip_gaji,
         mc.name AS candidate_name,
         cj.job_title,
         cc.name AS company_name,
         comp.base_salary,
         comp.gross_salary,
         comp.pph21,
         comp.bpjs_kesehatan,
         comp.bpjs_ketenagakerjaan,
         comp.net_salary
       FROM candidate_offer co
       JOIN master_candidate mc ON mc.id = co.candidate_id
       JOIN core_job cj ON cj.id = co.job_id
       JOIN core_company cc ON cc.id = co.company_id
       LEFT JOIN offer_compensation comp ON comp.offer_id = co.id
       WHERE co.id = $1`,
      [offer_id]
    );
    return result.rows[0] || null;
  }
}

export default new OfferPackModel();