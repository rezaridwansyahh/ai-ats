import getDb from '../../config/postgres.js';

class PortalOfferModel{
  
  async createOfferSend(data) {
    const query = `
      INSERT INTO offer_send (
        offer_id, token_expires_at, document, sent_at, sent_by, status
      )
      VALUES ($1, $2, $3, NOW(), $4, 'sent')
      RETURNING *
    `;
    const result = await getDb().query(query, [
      data.offer_id,
      data.token_expires_at,
      JSON.stringify(data.document || {}),
      data.sent_by || null,
    ]);
    return result.rows[0];
  }

  async getOfferSendByToken(token) {
    const query = `
      SELECT
        os.*,
        co.id             AS offer_id,
        co.offer_status,
        co.contract_status,
        co.position_title,
        co.contract_type,
        mc.name           AS candidate_name,
        ma.email          AS candidate_email,
        cj.job_title,
        cc.name           AS company_name
      FROM offer_send os
      JOIN candidate_offer co   ON co.id = os.offer_id
      JOIN master_candidate mc  ON mc.id = co.candidate_id
      JOIN core_job cj          ON cj.id = co.job_id
      JOIN core_company cc      ON cc.id = co.company_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      WHERE os.token::text = $1
        OR REPLACE(os.token::text, '-', '') = $1
      LIMIT 1
    `;
    const result = await getDb().query(query, [token]);
    return result.rows[0] || null;
  }  

  async getLatestOfferSend(offer_id) {
    const result = await getDb().query(
      `SELECT * FROM offer_send WHERE offer_id = $1 ORDER BY sent_at DESC LIMIT 1`,
      [offer_id]
    );
    return result.rows[0] || null;
  }  

  
  async getOfferSendHistory(offer_id) {
    const query = `
      SELECT os.*, mu.username AS sent_by_name
      FROM offer_send os
      LEFT JOIN master_users mu ON mu.id = os.sent_by
      WHERE os.offer_id = $1
      ORDER BY os.sent_at DESC
    `;
    const result = await getDb().query(query, [offer_id]);
    return result.rows;
  }

  async markOfferSendSigned(id) {
    const result = await getDb().query(
      `UPDATE offer_send SET signed_at = NOW(), status = 'signed', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  async revokeActiveOfferSends(offer_id, revoked_by, reason) {
    const result = await getDb().query(`
      UPDATE offer_send
      SET revoked_at = NOW(), revoked_by = $2, revocation_reason = $3, updated_at = NOW()
      WHERE offer_id = $1 AND status = 'sent' AND revoked_at IS NULL
      RETURNING *
    `, [offer_id, revoked_by, reason || 'Superseded by a new send']);
    return result.rows;
  }
}

export default new PortalOffer();