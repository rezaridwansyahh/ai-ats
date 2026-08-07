import getDb from '../../config/postgres.js';

class OfferPackModel {

  async setupRoster(offer_id, steps) {
    const db = getDb();
    await db.query(`DELETE FROM offer_approval WHERE offer_id = $1`, [offer_id]);

    const inserted = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const result = await db.query(
        `INSERT INTO offer_approval (offer_id, step_order, role, approver_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [offer_id, i, s.role, s.approver_name]
      );
      inserted.push(result.rows[0]);
    }
    return inserted;
  }

  async getByOfferId(offer_id) {
    const result = await getDb().query(
      `SELECT oas.*, mu.username AS decided_by_name
         FROM offer_approval oas
         LEFT JOIN master_users mu ON mu.id = oas.decided_by
        WHERE oas.offer_id = $1
        ORDER BY oas.step_order ASC`,
      [offer_id]
    );
    return result.rows;
  }

  async getById(step_id) {
    const result = await getDb().query(
      `SELECT * FROM offer_approval WHERE id = $1`,
      [step_id]
    );
    return result.rows[0] || null;
  }

  async decideStep({ step_id, status, note, decided_by }) {
    const result = await getDb().query(
      `UPDATE offer_approval
          SET status     = $2,
              note       = $3,
              decided_by = $4,
              decided_at = NOW(),
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [step_id, status, note || null, decided_by || null]
    );
    return result.rows[0] || null;
  }

  async getChainByToken(token) {
    const result = await getDb().query(
      `SELECT
         co.id AS offer_id,
         co.position_title,
         co.metadata->'approval_chain'   AS approval_chain,
         co.metadata->'offer_letter_final' AS offer_letter,
         mc.name    AS candidate_name,
         cj.job_title,
         comp.base_salary,
         comp.net_salary
       FROM candidate_offer co
       JOIN master_candidate mc ON mc.id = co.candidate_id
       JOIN core_job cj ON cj.id = co.job_id
       LEFT JOIN offer_compensation comp ON comp.offer_id = co.id
       WHERE co.metadata->'approval_chain'->>'token' = $1`,
      [token]
    );
    return result.rows[0] || null;
  }

  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         oas.*,
         mc.name AS candidate_name,
         co.id AS offer_id,
         co.metadata->'approval_chain' AS approval_chain
         FROM offer_approval oas
         JOIN candidate_offer co ON co.id = oas.offer_id
         JOIN master_candidate mc ON mc.id = co.candidate_id
        WHERE co.job_id = $1
        ORDER BY co.id, oas.step_order ASC`,
      [job_id]
    );
    return result.rows;
  }
}

export default new OfferPackModel();