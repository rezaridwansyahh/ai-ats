import jwt from 'jsonwebtoken';
import PortalBgConsentModel from './portal-bg.model.js';
import BackgroundCheckModel from '../background-check/background-check.model.js';

const JWT_SECRET = process.env.JWT_SECRET;

function isExpired(row) {
  return !!row.token_expires_at && new Date(row.token_expires_at) < new Date();
}

function isTokenFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

function validateRow(row) {
  if (!row) throw { status: 404, message: 'Invalid consent link.' };
  if (row.status === 'revoked') throw { status: 410, message: 'This consent link has been revoked.' };
  if (row.status === 'signed') throw { status: 409, message: 'Consent has already been signed.' };
  if (row.status === 'draft') throw { status: 403, message: 'This consent link has not been sent yet.' };
  if (isExpired(row)) throw { status: 410, message: 'This consent link has expired.' };
}

class PortalBgConsentService {

  async getByToken(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid consent link.' };

    const row = await PortalBgConsentModel.getByToken(token);
    validateRow(row);

    return {
      job_title:        row.job_title,
      company_name:     row.company_name,
      status:           row.status,
      token_expires_at: row.token_expires_at,
    };
  }

  // Public — candidate submits email to verify identity
  async verifyEmail(token, email) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid consent link.' };
    if (!email || !email.trim()) throw { status: 400, message: 'Email is required.' };

    const row = await PortalBgConsentModel.getByToken(token);
    validateRow(row);

    const submitted = email.trim().toLowerCase();
    const expected  = (row.candidate_email || '').toLowerCase();

    if (submitted !== expected) {
      throw { status: 403, message: 'Email does not match our records for this consent link.' };
    }

    // Issue a short-lived JWT scoped to this consent record
    const bgConsentToken = jwt.sign(
      { scope: 'bg_consent', bg_consent_id: row.id },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    return {
      bg_consent_token: bgConsentToken,
      consent: {
        job_title:        row.job_title,
        company_name:     row.company_name,
        candidate_name:   row.candidate_name,
        status:           row.status,
        sent_at:          row.sent_at,
        token_expires_at: row.token_expires_at,
        document:         row.document,
      },
    };
  }

  // JWT-protected — get full consent document
  async getConsent(token, bg_consent_id) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid consent link.' };

    const row = await PortalBgConsentModel.getByToken(token);
    validateRow(row);

    if (row.id !== bg_consent_id) {
      throw { status: 403, message: 'Token mismatch.' };
    }

    return {
      job_title:        row.job_title,
      company_name:     row.company_name,
      candidate_name:   row.candidate_name,
      status:           row.status,
      sent_at:          row.sent_at,
      token_expires_at: row.token_expires_at,
      document:         row.document,
    };
  }

  // JWT-protected — sign the consent
  async sign(token, bg_consent_id) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid consent link.' };

    const row = await PortalBgConsentModel.getByToken(token);
    validateRow(row);

    if (row.id !== bg_consent_id) {
      throw { status: 403, message: 'Token mismatch.' };
    }

    await PortalBgConsentModel.sign(row.id);
    await BackgroundCheckModel.updateStatus(row.candidate_bg_id, 'tracker');

    return { signed_at: new Date().toISOString() };
  }

}

export default new PortalBgConsentService();