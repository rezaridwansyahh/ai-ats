import getDb from '../../config/postgres.js';

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
        mc.name as candidate_name,
        ma.email as candidate_email,
        mc.information->>'phone' as candidate_phone,
        cj.job_title,
        comp.base_salary,
        comp.gross_salary,
        comp.net_salary,
        contract.start_date,
        contract.end_date,
        contract.signed_at
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      JOIN core_job cj ON co.job_id = cj.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      LEFT JOIN offer_contract contract ON co.id = contract.offer_id
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
        mc.name as candidate_name,
        ma.email as candidate_email,
        comp.base_salary,
        comp.net_salary,
        contract.signed_at
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      LEFT JOIN offer_contract contract ON co.id = contract.offer_id
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
        comp.id as compensation_id,
        comp.base_salary,
        comp.allowances,
        comp.bonus_structure,
        comp.gross_salary,
        comp.pph21,
        comp.bpjs_kesehatan,
        comp.bpjs_ketenagakerjaan,
        comp.net_salary,
        comp.calculation_metadata,
        contract.id as contract_id,
        contract.contract_type as contract_doc_type,
        contract.start_date,
        contract.end_date,
        contract.status as contract_doc_status,
        contract.pdf_url,
        contract.signed_at,
        contract.signature_data
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      JOIN core_job cj ON co.job_id = cj.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      LEFT JOIN offer_contract contract ON co.id = contract.offer_id
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
        comp.calculation_metadata,
        contract.status as contract_doc_status,
        contract.pdf_url
      FROM candidate_offer co
      JOIN master_candidate mc ON co.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      LEFT JOIN offer_compensation comp ON co.id = comp.offer_id
      LEFT JOIN offer_contract contract ON co.id = contract.offer_id
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

  // Update offer status
  async updateOfferStatus(offer_id, status, metadata = {}) {
    const query = `
      UPDATE candidate_offer
      SET
        offer_status = $2,
        metadata = metadata || $3::jsonb,
        updated_at = NOW()
      WHERE id = $1
    `;

    await getDb().query(query, [offer_id, status, JSON.stringify(metadata)]);
  }

  // Create negotiation record
  async createNegotiation(data) {
    const query = `
      INSERT INTO offer_negotiation (
        offer_id, initiated_by, message, requested_salary,
        response_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await getDb().query(query, [
      data.offer_id,
      data.initiated_by,
      data.message,
      data.requested_salary,
      data.response_type || null,
      data.status
    ]);

    return result.rows[0].id;
  }

  // Get negotiation history
  async getNegotiationHistory(offer_id) {
    const query = `
      SELECT *
      FROM offer_negotiation
      WHERE offer_id = $1
      ORDER BY created_at ASC
    `;

    const result = await getDb().query(query, [offer_id]);
    return result.rows;
  }

  // Create contract
  async createContract(data) {
    const query = `
      INSERT INTO offer_contract (
        offer_id, contract_type, start_date, end_date,
        status, pdf_url, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await getDb().query(query, [
      data.offer_id,
      data.contract_type,
      data.start_date,
      data.end_date,
      data.status,
      data.pdf_url || null,
      data.generated_by
    ]);

    return result.rows[0].id;
  }

  // Update contract status
  async updateContractStatus(offer_id, status, metadata = {}) {
    const query = `
      UPDATE offer_contract
      SET
        status = $2,
        metadata = metadata || $3::jsonb,
        updated_at = NOW()
      WHERE offer_id = $1
    `;

    await getDb().query(query, [offer_id, status, JSON.stringify(metadata)]);

    // Also update candidate_offer contract_status
    const updateOfferQuery = `
      UPDATE candidate_offer
      SET contract_status = $2
      WHERE id = $1
    `;

    await getDb().query(updateOfferQuery, [offer_id, status]);
  }

  // Get signed offers by job (for calibration)
  async getSignedOffersByJob(job_id, candidate_ids, company_id) {
    const query = `
      SELECT co.*, contract.signed_at
      FROM candidate_offer co
      JOIN offer_contract contract ON co.id = contract.offer_id
      WHERE co.job_id = $1
        AND co.candidate_id = ANY($2::int[])
        AND co.company_id = $3
        AND contract.status = 'signed'
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
        COUNT(*) FILTER (WHERE offer_status = 'negotiating') as negotiating,
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
      SET metadata = metadata || $2::jsonb, updated_at = NOW()
      WHERE id = $1
      RETURNING metadata
    `;
    const result = await getDb().query(query, [offer_id, JSON.stringify(metadata)]);
    return result.rows[0]?.metadata;
  }  

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
 
  async revokeActiveOfferSends(offer_id, revoked_by, reason) {
    const result = await getDb().query(`
      UPDATE offer_send
      SET revoked_at = NOW(), revoked_by = $2, revocation_reason = $3, updated_at = NOW()
      WHERE offer_id = $1 AND status = 'sent' AND revoked_at IS NULL
      RETURNING *
    `, [offer_id, revoked_by, reason || 'Superseded by a new send']);
    return result.rows;
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


}

export default new OfferModel();
