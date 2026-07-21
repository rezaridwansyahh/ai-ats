import jwt from 'jsonwebtoken';
import PortalOfferModel from './portal-offer.model.js';
import OfferModel from '../offer/offer.model.js';

const JWT_SECRET = process.env.JWT_SECRET;

function isExpired(row) {
  return !!row.token_expires_at && new Date(row.token_expires_at) < new Date();
}

function isTokenFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

function validateRow(row) {
  if (!row) throw { status: 404, message: 'Invalid offer link.' };
  if (row.status === 'revoked') throw { status: 410, message: 'This offer link has been revoked.' };
  if (row.status === 'signed') throw { status: 409, message: 'Offer has already been signed.' };
  if (row.status === 'draft') throw { status: 403, message: 'This offer link has not been sent yet.' };
  if (isExpired(row)) throw { status: 410, message: 'This offer link has expired.' };
}

class PortalOfferService {

  async getByToken(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid offer link.' };

    const row = await PortalOfferModel.getByToken(token);
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
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid offer link.' };
    if (!email || !email.trim()) throw { status: 400, message: 'Email is required.' };

    const row = await PortalOfferModel.getByToken(token);
    validateRow(row);

    const submitted = email.trim().toLowerCase();
    const expected  = (row.candidate_email || '').toLowerCase();

    if (submitted !== expected) {
      throw { status: 403, message: 'Email does not match our records for this offer link.' };
    }

    // Issue a short-lived JWT scoped to this offer_send record
    const offerToken = jwt.sign(
      { scope: 'offer_send', offer_send_id: row.id },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    return {
      offer_token: offerToken,
      offer: {
        job_title:        row.job_title,
        company_name:     row.company_name,
        candidate_name:   row.candidate_name,
        position_title:   row.position_title,
        contract_type:    row.contract_type,
        status:           row.status,
        sent_at:          row.sent_at,
        token_expires_at: row.token_expires_at,
        document:         row.document,
      },
    };
  }

  // JWT-protected — get full offer document
  async getOffer(token, offer_send_id) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid offer link.' };

    const row = await PortalOfferModel.getByToken(token);
    validateRow(row);

    if (row.id !== offer_send_id) {
      throw { status: 403, message: 'Token mismatch.' };
    }

    return {
      job_title:        row.job_title,
      company_name:     row.company_name,
      candidate_name:   row.candidate_name,
      position_title:   row.position_title,
      contract_type:    row.contract_type,
      status:           row.status,
      sent_at:          row.sent_at,
      token_expires_at: row.token_expires_at,
      document:         row.document,
    };
  }

  async sign(token, offer_send_id) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid offer link.' };

    const row = await PortalOfferModel.getByToken(token);
    validateRow(row);

    if (row.id !== offer_send_id) {
      throw { status: 403, message: 'Token mismatch.' };
    }

    await PortalOfferModel.sign(row.id);
    await OfferModel.updateOfferStatus(row.offer_id, 'accepted', { accepted_at: new Date() });

    return { signed_at: new Date().toISOString() };
  }
}

export default new PortalOfferService();