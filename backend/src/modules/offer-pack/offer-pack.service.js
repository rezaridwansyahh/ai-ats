import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import OfferPackModel from './offer-pack.model.js';
import OfferModel from '../offer/offer.model.js';

const JWT_SECRET = process.env.JWT_SECRET;
const DECISIONS = ['approved', 'amend', 'rejected'];

function resolveExpiry(offer, overrideDays) {
  const days = overrideDays || offer.metadata?.dispatch?.portal_expiry_days || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function isTokenFormat(s) {
  return typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s);
}

class OfferPackService {

  async decide(offer_id, decision, note, company_id, user_id) {
    if (!DECISIONS.includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved', 'amend', or 'rejected'" };
    }
    if (decision === 'amend' && !note?.trim()) {
      throw { status: 400, message: 'A note is required when requesting an amend' };
    }

    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }
    if (!offer.base_salary) {
      throw { status: 400, message: 'Finish Build (compensation) before recording an approval decision' };
    }

    const current = {
      decision,
      note: note || null,
      decided_by: user_id,
      decided_at: new Date(),
    };
    await OfferModel.mergeMetadata(offer_id, { approval: current });

    if (decision === 'rejected') {
      await OfferModel.updateOfferStatus(offer_id, 'rejected', {
        rejected_at: new Date(),
        rejected_by: user_id,
        rejection_source: 'internal_approval',
      });
    }

    return { decision: current, offer_status: decision === 'rejected' ? 'rejected' : offer.offer_status };
  }

  async getStatus(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const current = offer.metadata?.approval || null;
    const viewLink = offer.metadata?.approval_view || null;

    return {
      current,
      history: [],
      view_link: viewLink
        ? {
            token_expires_at: viewLink.token_expires_at,
            sent_to_email: viewLink.sent_to_email,
            generated_at: viewLink.generated_at,
            portal_link: `/portal/offer/approve-view/${viewLink.token}`,
          }
        : null,
    };
  }

  async getByJob(job_id) {
    return OfferPackModel.getByJob(job_id);
  }

  async generateViewLink(offer_id, expiry_days, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const email = await OfferPackModel.getUserEmail(user_id);
    if (!email) throw { status: 404, message: 'Could not find your account email' };

    const viewMeta = {
      token: randomUUID(),
      token_expires_at: resolveExpiry(offer, expiry_days),
      sent_to_email: email.trim().toLowerCase(),
      generated_at: new Date(),
      generated_by: user_id,
    };
    await OfferModel.mergeMetadata(offer_id, { approval_view: viewMeta });

    return {
      portal_link: `/portal/offer/approve-view/${viewMeta.token}`,
      token_expires_at: viewMeta.token_expires_at,
      sent_to_email: viewMeta.sent_to_email,
    };
  }

  async getViewLinkBasic(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid link.' };

    const row = await OfferPackModel.getViewLinkByToken(token);
    if (!row) throw { status: 404, message: 'Invalid link.' };

    const view = row.approval_view;
    if (view?.token_expires_at && new Date(view.token_expires_at) < new Date()) {
      throw { status: 410, message: 'This link has expired.' };
    }

    return { job_title: row.job_title, company_name: row.company_name };
  }

  async verifyViewLinkEmail(token, email) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid link.' };
    if (!email?.trim()) throw { status: 400, message: 'Email is required.' };

    const row = await OfferPackModel.getViewLinkByToken(token);
    if (!row) throw { status: 404, message: 'Invalid link.' };

    const view = row.approval_view;
    if (view?.token_expires_at && new Date(view.token_expires_at) < new Date()) {
      throw { status: 410, message: 'This link has expired.' };
    }

    const submitted = email.trim().toLowerCase();
    if (submitted !== view?.sent_to_email) {
      throw { status: 403, message: 'Email does not match our records for this link.' };
    }

    const approvalViewToken = jwt.sign(
      { scope: 'offer_approval_view', offer_id: row.offer_id },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    return {
      approval_view_token: approvalViewToken,
      job_title: row.job_title,
      company_name: row.company_name,
    };
  }

  async getSummary(token, offer_id_from_jwt) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid link.' };

    const row = await OfferPackModel.getViewLinkByToken(token);
    if (!row) throw { status: 404, message: 'Invalid link.' };
    if (row.offer_id !== offer_id_from_jwt) throw { status: 403, message: 'Token mismatch.' };

    const view = row.approval_view;
    if (view?.token_expires_at && new Date(view.token_expires_at) < new Date()) {
      throw { status: 410, message: 'This link has expired.' };
    }

    const summary = await OfferPackModel.getSummaryByOfferId(row.offer_id);
    if (!summary) throw { status: 404, message: 'Offer not found' };

    return {
      candidate_name: summary.candidate_name,
      job_title: summary.job_title,
      company_name: summary.company_name,
      position_title: summary.position_title,
      intake: summary.slip_gaji || { status: 'not_recorded' },
      build: {
        base_salary: summary.base_salary,
        gross_salary: summary.gross_salary,
        pph21: summary.pph21,
        bpjs_kesehatan: summary.bpjs_kesehatan,
        bpjs_ketenagakerjaan: summary.bpjs_ketenagakerjaan,
        net_salary: summary.net_salary,
      },
    };
  }
}

export default new OfferPackService();