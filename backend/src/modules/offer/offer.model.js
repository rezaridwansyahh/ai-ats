import getDb from '../../config/postgres.js';

// candidate_offer.offer_status values that get a matching real timestamp
// column on that same table. Anything not in this map (e.g. 'negotiating',
// 'draft') only touches offer_status + metadata.
const STATUS_TIMESTAMP_COLUMN = {
  sent: 'sent_at',
  accepted: 'accepted_at',
  rejected: 'rejected_at',
};

class OfferModel {
  // L1 Workboard - get all offers for company
  async getWorkboard(company_id) {
    const query = `
      SELECT
        co.id,
        co.candidate_id,
        co.job_id,
        co.position_title,
        co.contract_type,
        co.offer_status,
        co.contract_status,
        co.created_at,
        co.sent_at,
        co.accepted_at,
        co.rejected_at,
        co.expired_at,
        mc.name as candidate_name,
        ma.email as candidate_email,
        mc.information->>'phone' as candidate_phone,
        cj.job_title,
        comp.base_salary,
        comp.gross_salary,
        comp.net_salary
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      JOIN core_job cj ON co.job_id = cj.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      WHERE co.company_id = $1
      ORDER BY co.created_at DESC
    `;

    const result = await getDb().query(query, [company_id]);
    return result.rows;
  }

  // L2 Position - get offers for specific job
  async getOffersByJob(job_id, company_id) {
    const query = `
      SELECT
        co.id,
        co.candidate_id,
        co.position_title,
        co.contract_type,
        co.offer_status,
        co.contract_status,
        co.created_at,
        co.sent_at,
        co.accepted_at,
        co.rejected_at,
        mc.name as candidate_name,
        ma.email as candidate_email,
        comp.base_salary,
        comp.net_salary
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      WHERE co.job_id = $1 AND co.company_id = $2
      ORDER BY co.created_at DESC
    `;

    const result = await getDb().query(query, [job_id, company_id]);
    return result.rows;
  }

  // Get single offer by ID (internal)
  async getOfferById(offer_id, company_id) {
    const query = `
      SELECT
        co.*,
        mc.name as candidate_name,
        ma.email as candidate_email,
        mc.information->>'phone' as candidate_phone,
        mc.information as candidate_profile,
        cj.job_title,
        cj.job_desc AS job_description,
        cc.name as company_name,
        comp.id as compensation_id,
        comp.base_salary,
        comp.allowances,
        comp.bonus_structure,
        comp.gross_salary,
        comp.pph21,
        comp.bpjs_kesehatan,
        comp.bpjs_ketenagakerjaan,
        comp.net_salary,
        comp.calculation_metadata
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      JOIN core_job cj ON co.job_id = cj.id
      JOIN core_company cc ON co.company_id = cc.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      WHERE co.id = $1 AND co.company_id = $2
    `;

    const result = await getDb().query(query, [offer_id, company_id]);
    return result.rows[0];
  }

  // Get offer by ID (public - for candidate portal, no company_id check)
  async getOfferByIdPublic(offer_id) {
    const query = `
      SELECT
        co.*,
        mc.name as candidate_name,
        ma.email as candidate_email,
        comp.id as compensation_id,
        comp.base_salary,
        comp.allowances,
        comp.bonus_structure,
        comp.gross_salary,
        comp.pph21,
        comp.bpjs_kesehatan,
        comp.bpjs_ketenagakerjaan,
        comp.net_salary,
        comp.calculation_metadata
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      WHERE co.id = $1
    `;

    const result = await getDb().query(query, [offer_id]);
    return result.rows[0];
  }

  // Create offer
  async createOffer(data) {
    const query = `
      INSERT INTO candidate_offer (
        company_id, candidate_id, job_id, position_title,
        contract_type, offer_status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await getDb().query(query, [
      data.company_id,
      data.candidate_id,
      data.job_id,
      data.position_title,
      data.contract_type,
      data.offer_status,
      data.created_by
    ]);

    return result.rows[0].id;
  }

  // Create compensation
  async createCompensation(data) {
    const query = `
      INSERT INTO offer_compensation (
        offer_id, base_salary, allowances, bonus_structure,
        gross_salary, pph21, bpjs_kesehatan, bpjs_ketenagakerjaan,
        net_salary, calculation_metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const result = await getDb().query(query, [
      data.offer_id,
      data.base_salary,
      JSON.stringify(data.allowances),
      JSON.stringify(data.bonus_structure),
      data.gross_salary,
      data.pph21,
      data.bpjs_kesehatan,
      data.bpjs_ketenagakerjaan,
      data.net_salary,
      JSON.stringify(data.calculation_metadata)
    ]);

    return result.rows[0].id;
  }

  // Update compensation
  async updateCompensation(offer_id, data) {
    const query = `
      UPDATE offer_compensation
      SET
        base_salary = $2,
        allowances = $3,
        bonus_structure = $4,
        gross_salary = $5,
        pph21 = $6,
        bpjs_kesehatan = $7,
        bpjs_ketenagakerjaan = $8,
        net_salary = $9,
        calculation_metadata = $10,
        updated_at = NOW()
      WHERE offer_id = $1
    `;

    await getDb().query(query, [
      offer_id,
      data.base_salary,
      JSON.stringify(data.allowances),
      JSON.stringify(data.bonus_structure),
      data.gross_salary,
      data.pph21,
      data.bpjs_kesehatan,
      data.bpjs_ketenagakerjaan,
      data.net_salary,
      JSON.stringify(data.calculation_metadata)
    ]);
  }

  async updateOfferStatus(offer_id, status, metadata = {}) {
    const timestampColumn = STATUS_TIMESTAMP_COLUMN[status];

    const setClauses = [
      'offer_status = $2',
      "metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb",
      'updated_at = NOW()',
    ];
    if (timestampColumn) {
      setClauses.push(`${timestampColumn} = NOW()`);
    }

    const query = `
      UPDATE candidate_offer
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `;

    await getDb().query(query, [offer_id, status, JSON.stringify(metadata)]);
  }

  async markOfferExpired(offer_id) {
    await getDb().query(`
      UPDATE candidate_offer
      SET offer_status = 'expired', expired_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [offer_id]);
  }

  async updateOfferContractStatus(offer_id, status) {
    await getDb().query(`
      UPDATE candidate_offer SET contract_status = $2, updated_at = NOW() WHERE id = $1
    `, [offer_id, status]);
  }

  async getSignedOffersByJob(job_id, candidate_ids, company_id) {
    const query = `
      SELECT co.*
      FROM candidate_offer co
      WHERE co.job_id = $1
        AND co.candidate_id = ANY($2::int[])
        AND co.company_id = $3
        AND co.contract_status = 'signed'
    `;
    const result = await getDb().query(query, [job_id, candidate_ids, company_id]);
    return result.rows;
  }

  // Get offer statistics by job
  async getOfferStatsByJob(job_id, company_id) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE offer_status = 'draft') as draft,
        COUNT(*) FILTER (WHERE offer_status = 'sent') as sent,
        COUNT(*) FILTER (WHERE offer_status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE offer_status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE contract_status = 'signed') as signed,
        AVG(comp.net_salary) as avg_salary,
        MIN(comp.net_salary) as min_salary,
        MAX(comp.net_salary) as max_salary
      FROM candidate_offer co
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      WHERE co.job_id = $1 AND co.company_id = $2
    `;

    const result = await getDb().query(query, [job_id, company_id]);
    return result.rows[0];
  }

  async mergeMetadata(offer_id, metadata) {
    const query = `
      UPDATE candidate_offer
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW()
      WHERE id = $1
      RETURNING metadata
    `;
    const result = await getDb().query(query, [offer_id, JSON.stringify(metadata)]);
    return result.rows[0]?.metadata;
  }

  async getNegotiationHistory(offer_id) {
    const result = await getDb().query(
      `SELECT * FROM offer_negotiation WHERE offer_id = $1 ORDER BY created_at DESC`,
      [offer_id]
    );
    return result.rows;
  }

  async createNegotiation(data) {
    const query = `
      INSERT INTO offer_negotiation (
        offer_id, initiated_by, message, requested_salary, response_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await getDb().query(query, [
      data.offer_id,
      data.initiated_by,
      data.message,
      data.requested_salary || null,
      data.response_type || null,
      data.status || 'pending',
    ]);
    return result.rows[0];
  }

  async createOfferSend(data) {
    const document_type = data.document_type || 'offer';
    const query = `
      INSERT INTO offer_send (
        offer_id, document_type, token_expires_at, sent_at, sent_by, status
      )
      VALUES ($1, $2, $3, NOW(), $4, 'sent')
      RETURNING *
    `;
    const result = await getDb().query(query, [
      data.offer_id,
      document_type,
      data.token_expires_at,
      data.sent_by || null,
    ]);
    return result.rows[0];
  }

  async revokeActiveOfferSends(offer_id, revoked_by, reason, document_type = 'offer') {
    const result = await getDb().query(`
      UPDATE offer_send
      SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revocation_reason = $3, updated_at = NOW()
      WHERE offer_id = $1 AND document_type = $4 AND status = 'sent' AND revoked_at IS NULL
      RETURNING *
    `, [offer_id, revoked_by, reason || 'Superseded by a new send', document_type]);
    return result.rows;
  }

  async getOfferSendHistory(offer_id, document_type = 'offer') {
    const query = `
      SELECT os.*, mu.username AS sent_by_name
      FROM offer_send os
      LEFT JOIN master_users mu ON mu.id = os.sent_by
      WHERE os.offer_id = $1 AND os.document_type = $2
      ORDER BY os.sent_at DESC
    `;
    const result = await getDb().query(query, [offer_id, document_type]);
    return result.rows;
  }

  async getOfferSendByToken(token) {
    const query = `
      SELECT
        os.*,
        mc.name AS candidate_name
      FROM offer_send os
      JOIN candidate_offer co  ON co.id = os.offer_id
      JOIN master_candidate mc ON mc.id = co.candidate_id
      WHERE os.token::text = $1
         OR REPLACE(os.token::text, '-', '') = $1
      LIMIT 1
    `;
    const result = await getDb().query(query, [token]);
    return result.rows[0] || null;
  }

  async upsertOfferDocument(data) {
    const document_type = data.document_type || 'offer';
    const query = `
      INSERT INTO offer_document (offer_id, document_type, file, method, uploaded_by, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (offer_id, document_type) DO UPDATE
      SET file = EXCLUDED.file,
          method = EXCLUDED.method,
          uploaded_by = EXCLUDED.uploaded_by,
          uploaded_at = NOW(),
          updated_at = NOW()
      RETURNING *
    `;
    const result = await getDb().query(query, [
      data.offer_id,
      document_type,
      data.file,
      data.method,
      data.uploaded_by || null,
    ]);
    return result.rows[0];
  }

  async getOfferDocument(offer_id, document_type = 'offer') {
    const result = await getDb().query(`
      SELECT od.*, mu.username AS uploaded_by_name
      FROM offer_document od
      LEFT JOIN master_users mu ON mu.id = od.uploaded_by
      WHERE od.offer_id = $1 AND od.document_type = $2
    `, [offer_id, document_type]);
    return result.rows[0] || null;
  }

  async upsertContractExecutedDocument(data) {
    const query = `
      INSERT INTO contract_executed_document (offer_id, file, uploaded_by, uploaded_at, notes)
      VALUES ($1, $2, $3, NOW(), $4)
      ON CONFLICT (offer_id) DO UPDATE
      SET file = EXCLUDED.file,
          uploaded_by = EXCLUDED.uploaded_by,
          uploaded_at = NOW(),
          notes = EXCLUDED.notes,
          updated_at = NOW()
      RETURNING *
    `;
    const result = await getDb().query(query, [
      data.offer_id,
      data.file,
      data.uploaded_by || null,
      data.notes || null,
    ]);
    return result.rows[0];
  }

  async getContractExecutedDocument(offer_id) {
    const result = await getDb().query(`
      SELECT ced.*, mu.username AS uploaded_by_name
      FROM contract_executed_document ced
      LEFT JOIN master_users mu ON mu.id = ced.uploaded_by
      WHERE ced.offer_id = $1
    `, [offer_id]);
    return result.rows[0] || null;
  }

  async getLatestOfferSend(offer_id, document_type = 'offer') {
    const result = await getDb().query(`
      SELECT *
      FROM offer_send
      WHERE offer_id = $1 AND document_type = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [offer_id, document_type]);
    return result.rows[0] || null;
  }

}

export default new OfferModel();