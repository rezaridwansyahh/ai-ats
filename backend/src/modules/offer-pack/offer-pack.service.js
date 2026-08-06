import OfferPackModel from './offer-pack.model.js';
import OfferModel from '../offer/offer.model.js';

const DECISIONS = ['approved', 'rejected'];
const DEFAULT_EXPIRY_DAYS = 7;

function expiryDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

class OfferPackService {

  async create(offer_id, approver_name, company_id, user_id) {
    if (!approver_name || !approver_name.trim()) {
      throw { status: 400, message: 'approver_name is required' };
    }

    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!offer.base_salary) {
      throw { status: 400, message: 'Finish Build (compensation) before requesting approval' };
    }

    const existing = await OfferPackModel.getByOfferId(offer_id);
    if (existing) {
      throw { status: 409, message: 'An approval link already exists for this offer — use resend to issue a new one' };
    }

    const approval = await OfferPackModel.create({
      offer_id,
      approver_name: approver_name.trim(),
      token_expires_at: expiryDate(DEFAULT_EXPIRY_DAYS),
      sent_by: user_id,
    });

    return { ...approval, portal_link: `/portal/offer-approval/${approval.token}` };
  }

  async getByOfferId(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const approval = await OfferPackModel.getByOfferId(offer_id);
    return approval || { offer_id: Number(offer_id), status: 'not_sent' };
  }

  async getByToken(token) {
    const approval = await OfferPackModel.getByToken(token);
    if (!approval) throw { status: 404, message: 'Approval link not found' };

    if (approval.revoked_at) {
      throw { status: 410, message: 'This approval link has been revoked' };
    }
    if (approval.token_expires_at && new Date(approval.token_expires_at) < new Date()) {
      throw { status: 410, message: 'This approval link has expired' };
    }
    if (approval.status !== 'pending') {
      throw { status: 410, message: `This offer has already been ${approval.status}` };
    }

    return approval;
  }

  async decideByToken(token, decision, note) {
    if (!DECISIONS.includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }

    await this.getByToken(token);

    const updated = await OfferPackModel.decideByToken({ token, status: decision, note });
    if (!updated) {
      throw { status: 409, message: 'This approval link is no longer active' };
    }
    return updated;
  }

  async decideByOfferId(offer_id, decision, note, company_id, user_id) {
    if (!DECISIONS.includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }

    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }

    const updated = await OfferPackModel.decideByOfferId({
      offer_id, status: decision, note, decided_by: user_id,
    });
    if (!updated) {
      throw { status: 409, message: 'No pending approval found for this offer — it may already be decided or revoked' };
    }
    return updated;
  }

  async revoke(offer_id, company_id, user_id, reason) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const revoked = await OfferPackModel.revoke(offer_id, user_id, reason);
    if (!revoked) throw { status: 400, message: 'No active approval link to revoke' };
    return revoked;
  }

  async resend(offer_id, approver_name, company_id, user_id) {
    if (!approver_name || !approver_name.trim()) {
      throw { status: 400, message: 'approver_name is required' };
    }

    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }

    const reissued = await OfferPackModel.reissue({
      offer_id,
      approver_name: approver_name.trim(),
      token_expires_at: expiryDate(DEFAULT_EXPIRY_DAYS),
      sent_by: user_id,
    });
    if (!reissued) throw { status: 404, message: 'No approval record found for this offer — create one first' };

    return { ...reissued, portal_link: `/portal/offer-approval/${reissued.token}` };
  }

 
  async getByJob(job_id, company_id) {
    return OfferPackModel.getByJob(job_id);
  }
}

export default new OfferPackService();