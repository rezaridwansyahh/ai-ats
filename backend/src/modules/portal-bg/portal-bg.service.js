import PortalBgConsentModel from './portal-bg.model.js';
import BackgroundCheckModel from '../background-check/background-check.model.js';

function isExpired(row) {
  return !!row.token_expires_at && new Date(row.token_expires_at) < new Date();
}

function isTokenFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

class PortalBgConsentService {

  async getByToken(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid consent link.' };

    const row = await PortalBgConsentModel.getByToken(token);
    if (!row) throw { status: 404, message: 'Invalid consent link.' };

    if (row.status === 'revoked') {
      throw { status: 410, message: 'This consent link has been revoked.' };
    }
    if (row.status === 'signed') {
      throw { status: 409, message: 'Consent has already been signed.' };
    }
    if (row.status === 'draft') {
      throw { status: 403, message: 'This consent link has not been sent yet.' };
    }
    if (isExpired(row)) {
      throw { status: 410, message: 'This consent link has expired.' };
    }

    return {
      job_title:    row.job_title,
      company_name: row.company_name,
      candidate_name: row.candidate_name,
      status:       row.status,
      sent_at:      row.sent_at,
      token_expires_at: row.token_expires_at,
      document:     row.document,
    };
  }

  async sign(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid consent link.' };

    const row = await PortalBgConsentModel.getByToken(token);
    if (!row) throw { status: 404, message: 'Invalid consent link.' };

    if (row.status === 'revoked') {
      throw { status: 410, message: 'This consent link has been revoked.' };
    }
    if (row.status === 'signed') {
      throw { status: 409, message: 'Consent has already been signed.' };
    }
    if (row.status === 'draft') {
      throw { status: 403, message: 'This consent link has not been sent yet.' };
    }
    if (isExpired(row)) {
      throw { status: 410, message: 'This consent link has expired.' };
    }

    // Sign the consent record
    await PortalBgConsentModel.sign(row.id);

    // Advance candidate_bg status from consent → tracker
    await BackgroundCheckModel.updateStatus(row.candidate_bg_id, 'tracker');

    return { signed_at: new Date().toISOString() };
  }

}

export default new PortalBgConsentService();