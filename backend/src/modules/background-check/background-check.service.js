import backgroundCheckModel from './background-check.model.js';
import jobModel from '../job/job.model.js';
import aiService from '../../shared/services/ai.service.js';

class BackgroundCheckService {
  async getWorkboard(company_id) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    return await backgroundCheckModel.getWorkboard(company_id);
  }

  async getByJob(job_id, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    if (company_id && job.company_id && job.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.getByJob(job_id);
  }

  async getById(bg_id, { company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const row = await backgroundCheckModel.getBgById(bg_id);
    if (!row) throw { status: 404, message: 'Background check record not found' };

    if (company_id && row.company_id && row.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return row;
  }

  async getByCandidateId(candidate_id, { company_id = null } = {}) {
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };

    const row = await backgroundCheckModel.getByCandidateId(candidate_id);

    if (company_id && row.company_id && row.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return row;
  }

  async updateStatus(bg_id, { status, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const valid = ['claims', 'consent', 'tracker', 'verdict', 'done', 'archived'];
    if (!valid.includes(status)) {
      throw { status: 400, message: `status must be one of: ${valid.join(', ')}` };
    }

    const existing = await backgroundCheckModel.getBgById(bg_id);
    if (!existing) throw { status: 404, message: 'Background check record not found' };

    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.updateStatus(bg_id, status);
  }


  async saveVerdict(bg_id, { verdict, verdict_note, decided_by, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const validVerdicts = ['pass', 'pass_with_concerns', 'fail'];
    if (!validVerdicts.includes(verdict)) {
      throw { status: 400, message: `verdict must be one of: ${validVerdicts.join(', ')}` };
    }

    if (verdict === 'pass_with_concerns') {
      if (!verdict_note?.gap || !verdict_note?.context || !verdict_note?.mitigation) {
        throw { status: 400, message: 'pass_with_concerns requires verdict_note with gap, context, and mitigation fields' };
      }
    }

    const existing = await backgroundCheckModel.getBgById(bg_id);
    if (!existing) throw { status: 404, message: 'Background check record not found' };

    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    if (existing.status !== 'verdict') {
      throw { status: 400, message: 'Cannot save verdict — record is not at verdict stage' };
    }

    return await backgroundCheckModel.saveVerdict(bg_id, { verdict, verdict_note, decided_by });
  }

  // ── Archive ────────────────────────────────────────────────────────────────

  async archive(bg_id, { archived_reason, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const validReasons = ['no_consent', 'consent_timeout', 'verdict_fail', 'calibration_advance'];
    if (!validReasons.includes(archived_reason)) {
      throw { status: 400, message: `archived_reason must be one of: ${validReasons.join(', ')}` };
    }

    const existing = await backgroundCheckModel.getBgById(bg_id);
    if (!existing) throw { status: 404, message: 'Background check record not found' };

    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.archive(bg_id, archived_reason);
  }

  // ── Claims ─────────────────────────────────────────────────────────────────

  async getClaims(bg_id, { company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.getByBgId(bg_id);
  }

  async extractClaims(bg_id, { company_id = null } = {}, context = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    if (bg.status !== 'claims') {
      throw { status: 400, message: 'Claims can only be extracted when status is claims' };
    }

    const db = (await import('../../config/postgres.js')).default();
    const candidateRow = await db.query(`
      SELECT
        mc.name,
        mc.job_id,
        ma.information
      FROM master_candidate mc
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      WHERE mc.id = $1
    `, [bg.candidate_id]);

    if (!candidateRow.rows[0]) {
      throw { status: 404, message: 'Candidate not found' };
    }

    const { information, job_id } = candidateRow.rows[0];

    if (!information) {
      throw { status: 422, message: 'No parsed CV data found — add claims manually' };
    }

    const jobRow = await db.query(`
      SELECT job_title FROM core_job WHERE id = $1
    `, [job_id]);

    const job_title = jobRow.rows[0]?.job_title || '';

    const { claims } = await aiService.extractBgClaims(
      information,
      job_title,
      { ...context, company_id: bg.company_id }
    );

    await backgroundCheckModel.replaceAiClaims(bg_id, claims);
    return await backgroundCheckModel.getByBgId(bg_id);
  }

  async addClaim(bg_id, { claim_text, claim_detail, lane_type, company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    if (!claim_text || !claim_text.trim()) {
      throw { status: 400, message: 'claim_text is required' };
    }

    const validLanes = ['identity', 'edu', 'emp', 'cert', 'crim', 'cred', 'salary'];
    if (!validLanes.includes(lane_type)) {
      throw { status: 400, message: `lane_type must be one of: ${validLanes.join(', ')}` };
    }

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.create({
      candidate_bg_id: bg_id,
      claim_text:      claim_text.trim(),
      claim_detail:    claim_detail?.trim() || null,
      lane_type,
    });
  }

  async updateClaim(claim_id, { claim_text, claim_detail, lane_type, company_id = null, edited_by = null } = {}) {
    if (!claim_id) throw { status: 400, message: 'claim_id is required' };

    const validLanes = ['identity', 'edu', 'emp', 'cert', 'crim', 'cred', 'salary'];
    if (!validLanes.includes(lane_type)) {
      throw { status: 400, message: `lane_type must be one of: ${validLanes.join(', ')}` };
    }

    if (!claim_text || !claim_text.trim()) {
      throw { status: 400, message: 'claim_text is required' };
    }

    const existing = await backgroundCheckModel.getClaimById(claim_id);
    if (!existing) throw { status: 404, message: 'Claim not found' };

    if (company_id) {
      const bg = await backgroundCheckModel.getBgById(existing.candidate_bg_id);
      if (bg?.company_id && bg.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    return await backgroundCheckModel.update(claim_id, {
      claim_text:   claim_text.trim(),
      claim_detail: claim_detail?.trim() || null,
      lane_type,
      edited_by,
    });
  }

  async toggleClaim(claim_id, { selected, company_id = null } = {}) {
    if (!claim_id) throw { status: 400, message: 'claim_id is required' };

    if (typeof selected !== 'boolean') {
      throw { status: 400, message: 'selected must be a boolean' };
    }

    const existing = await backgroundCheckModel.getClaimById(claim_id);
    if (!existing) throw { status: 404, message: 'Claim not found' };

    if (company_id) {
      const bg = await backgroundCheckModel.getBgById(existing.candidate_bg_id);
      if (bg?.company_id && bg.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    return await backgroundCheckModel.updateSelected(claim_id, selected);
  }

  async deleteClaim(claim_id, { company_id = null } = {}) {
    if (!claim_id) throw { status: 400, message: 'claim_id is required' };

    const existing = await backgroundCheckModel.getClaimById(claim_id);
    if (!existing) throw { status: 404, message: 'Claim not found' };

    if (company_id) {
      const bg = await backgroundCheckModel.getBgById(existing.candidate_bg_id);
      if (bg?.company_id && bg.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    return await backgroundCheckModel.delete(claim_id);
  }

  async confirmClaims(bg_id, { company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    const selectedCount = await backgroundCheckModel.countSelected(bg_id);
    if (selectedCount === 0) {
      throw { status: 400, message: 'Select at least one claim before confirming' };
    }
    if (bg.status === 'claims') {
      return await backgroundCheckModel.updateStatus(bg_id, 'consent');
    }
    return bg;
  }

  async getConsent(bg_id, { company_id = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    return await backgroundCheckModel.ensureConsent(bg_id);
  }  

  async generateConsentLink(bg_id, { company_id = null, sent_by = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    const claims = await backgroundCheckModel.getByBgId(bg_id);
    const selectedClaims = claims.filter((c) => c.selected);

    if (selectedClaims.length === 0) {
      throw { status: 400, message: 'No selected claims — confirm claims first' };
    }

    const laneLabels = {
      identity: 'Identitas — verifikasi NIK, KTP, dan dokumen identitas resmi',
      edu:      'Pendidikan — verifikasi ijazah dan transkrip pendidikan',
      emp:      'Pekerjaan — verifikasi riwayat pekerjaan',
      cert:     'Sertifikasi — verifikasi sertifikat dan lisensi profesional',
      crim:     'Catatan kepolisian — SKCK aktif dari POLRI',
      cred:     'Riwayat kredit — BI Checking / OJK SLIK Online',
      salary:   'Riwayat gaji — verifikasi kompensasi terakhir',
    };

    const uniqueLanes = [...new Set(selectedClaims.map((c) => c.lane_type))];
    const lanes = uniqueLanes.map((lt) => ({
      lane_type:   lt,
      label:       laneLabels[lt] || lt,
      description: selectedClaims
        .filter((c) => c.lane_type === lt)
        .map((c) => c.claim_text)
        .join(' · '),
    }));

    const document = {
      candidate_name: bg.candidate_name,
      position:       bg.job_title,
      lanes,
      generated_at:   new Date().toISOString(),
    };

    const existing = await backgroundCheckModel.getConsentByBgId(bg_id);
    if (existing?.status === 'signed') {
      throw { status: 400, message: 'Consent already signed — revoke first to regenerate' };
    }

    let consent;
    if (!existing) {
      await backgroundCheckModel.ensureConsent(bg_id);
      consent = await backgroundCheckModel.sendConsent(bg_id, { document, sent_by });
    } else {
      consent = await backgroundCheckModel.resendConsent(bg_id, { document, sent_by });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return {
      ...consent,
      portal_url: `${baseUrl}/portal/bg/consent/${consent.token}`,  
    };
  }  

  async revokeConsent(bg_id, { revocation_reason, company_id = null, revoked_by = null } = {}) {
    if (!bg_id) throw { status: 400, message: 'bg_id is required' };

    const bg = await backgroundCheckModel.getBgById(bg_id);
    if (!bg) throw { status: 404, message: 'Background check record not found' };

    if (company_id && bg.company_id && bg.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    const consent = await backgroundCheckModel.getConsentByBgId(bg_id);
    if (!consent) throw { status: 404, message: 'No consent record found' };

    if (consent.status === 'revoked') {
      throw { status: 400, message: 'Consent is already revoked' };
    }
    if (consent.status === 'draft') {
      throw { status: 400, message: 'Cannot revoke a draft consent — generate a link first' };
    }

    return await backgroundCheckModel.revokeConsent(bg_id, { revoked_by, revocation_reason });
  }  

}

export default new BackgroundCheckService();