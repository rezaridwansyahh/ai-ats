import jwt from 'jsonwebtoken';
import PortalOfferModel from './portal-offer.model.js';
import OfferModel from '../offer/offer.model.js';

class PortalOfferService {

  async sendOfferLetter(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
  
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
  
    const approvalStatus = offer.metadata?.approval?.status;
    if (approvalStatus !== 'approved') {
      throw { status: 400, message: 'Offer must be approved before it can be sent' };
    }
    if (!offer.metadata?.draft_document) {
      throw { status: 400, message: 'Generate the draft document before sending' };
    }
  
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
    const send = await PortalOfferModel.createOfferSend({
      offer_id,
      token_expires_at: expiresAt,
      document: offer.metadata.draft_document,
      sent_by: user_id,
    });
  
    await OfferModel.updateOfferStatus(offer_id, 'sent', {
      sent_at: new Date(),
      sent_by: user_id
    });
  
    return {
      message: 'Offer letter sent successfully',
      token_expires_at: send.token_expires_at,
    };
  }
  
  async resendOffer(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
  
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    if (!['sent', 'negotiating'].includes(offer.offer_status)) {
      throw { status: 400, message: 'Can only resend offers that are sent or negotiating' };
    }
  
    await PortalOfferModel.revokeActiveOfferSends(offer_id, user_id, 'Resent by recruiter');
  
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const send = await PortalOfferModel.createOfferSend({
      offer_id,
      token_expires_at: expiresAt,
      document: offer.metadata?.draft_document || {},
      sent_by: user_id,
    });
  
    return {
      message: 'Offer resent successfully',
      token_expires_at: send.token_expires_at,
    };
  }
  
  async getSendHistory(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    return OfferModel.getOfferSendHistory(offer_id);
  }
}

export default new PortalOfferService();