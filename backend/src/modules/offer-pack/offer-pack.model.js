import getDb from '../../config/postgres.js';

class OfferPackModel {

  async create({ offer_id, approver_name, token_expires_at, sent_by }) {
    const result = await getDb().query(
      `INSERT INTO offer_approval (offer_id, approver_name, token_expires_at, sent_at, sent_by, status)
       VALUES ($1, $2, $3, NOW(), $4, 'pending')
       RETURNING *`,
      [offer_id, approver_name, token_expires_at || null, sent_by || null]
    );
    return result.rows[0];
  }

  async getByOfferId(offer_id) {
    const result = await getDb().query(
      `SELECT
         oa.*,
         mc.name    AS candidate_name,
         cj.job_title,
         mu.username AS decided_by_name
       FROM offer_approval oa
       JOIN candidate_offer co ON co.id = oa.offer_id
       JOIN master_candidate mc ON mc.id = co.candidate_id
       JOIN core_job cj ON cj.id = co.job_id
       LEFT JOIN master_users mu ON mu.id = oa.decided_by
       WHERE oa.offer_id = $1`,
      [offer_id]
    );
    return result.rows[0] || null;
  }

  async getByToken(token) {
    const result = await getDb().query(
      `SELECT
         oa.*,
         mc.name           AS candidate_name,
         co.position_title,
         cj.job_title,
         comp.base_salary,
         comp.net_salary
       FROM offer_approval oa
       JOIN candidate_offer co ON co.id = oa.offer_id
       JOIN master_candidate mc ON mc.id = co.candidate_id
       JOIN core_job cj ON cj.id = co.job_id
       LEFT JOIN offer_compensation comp ON comp.offer_id = co.id
       WHERE oa.token = $1`,
      [token]
    );
    return result.rows[0] || null;
  }

  async decideByToken({ token, status, note }) {
    const result = await getDb().query(
      `UPDATE offer_approval
          SET status     = $2,
              note       = $3,
              decided_at = NOW(),
              updated_at = NOW()
        WHERE token = $1
          AND status = 'pending'
          AND revoked_at IS NULL
        RETURNING *`,
      [token, status, note || null]
    );
    return result.rows[0] || null;
  }

  async decideByOfferId({ offer_id, status, note, decided_by }) {
    const result = await getDb().query(
      `UPDATE offer_approval
          SET status     = $2,
              note       = $3,
              decided_by = $4,
              decided_at = NOW(),
              updated_at = NOW()
        WHERE offer_id = $1
          AND status   = 'pending'
          AND revoked_at IS NULL
        RETURNING *`,
      [offer_id, status, note || null, decided_by || null]
    );
    return result.rows[0] || null;
  }

  async revoke(offer_id, revoked_by, reason) {
    const result = await getDb().query(
      `UPDATE offer_approval
          SET revoked_at        = NOW(),
              revoked_by        = $2,
              revocation_reason = $3,
              updated_at        = NOW()
        WHERE offer_id = $1
          AND status   = 'pending'
          AND revoked_at IS NULL
        RETURNING *`,
      [offer_id, revoked_by || null, reason || null]
    );
    return result.rows[0] || null;
  }

  async reissue({ offer_id, approver_name, token_expires_at, sent_by }) {
    const result = await getDb().query(
      `UPDATE offer_approval
          SET approver_name     = $2,
              token             = gen_random_uuid(),
              token_expires_at  = $3,
              sent_at           = NOW(),
              sent_by           = $4,
              status            = 'pending',
              note              = NULL,
              decided_at        = NULL,
              decided_by        = NULL,
              revoked_at        = NULL,
              revoked_by        = NULL,
              revocation_reason = NULL,
              updated_at        = NOW()
        WHERE offer_id = $1
        RETURNING *`,
      [offer_id, approver_name, token_expires_at || null, sent_by || null]
    );
    return result.rows[0] || null;
  }

  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         oa.*,
         mc.name AS candidate_name
       FROM offer_approval oa
       JOIN candidate_offer co ON co.id = oa.offer_id
       JOIN master_candidate mc ON mc.id = co.candidate_id
       WHERE co.job_id = $1
       ORDER BY oa.created_at DESC`,
      [job_id]
    );
    return result.rows;
  }
}

export default new OfferPackModel();