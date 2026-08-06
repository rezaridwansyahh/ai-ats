import OfferPackService from './offer-pack.service.js';

class OfferPackController {

  async create(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { approver_name } = req.body;
      const result = await OfferPackService.create(offer_id, approver_name, company_id, user_id);
      res.status(201).json({ message: 'Approval link created', approval: result });
    } catch (err) {
      console.error('OfferPackController.create:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByOfferId(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferPackService.getByOfferId(offer_id, company_id);
      res.json({ message: 'Approval fetched', approval: result });
    } catch (err) {
      console.error('OfferPackController.getByOfferId:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async decide(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { decision, note } = req.body;
      const result = await OfferPackService.decideByOfferId(offer_id, decision, note, company_id, user_id);
      res.json({ message: `Offer ${decision}`, approval: result });
    } catch (err) {
      console.error('OfferPackController.decide:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async revoke(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { reason } = req.body;
      const result = await OfferPackService.revoke(offer_id, company_id, user_id, reason);
      res.json({ message: 'Approval link revoked', approval: result });
    } catch (err) {
      console.error('OfferPackController.revoke:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async resend(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { approver_name } = req.body;
      const result = await OfferPackService.resend(offer_id, approver_name, company_id, user_id);
      res.json({ message: 'Approval link resent', approval: result });
    } catch (err) {
      console.error('OfferPackController.resend:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJob(req, res) {
    try {
      const { job_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferPackService.getByJob(job_id, company_id);
      res.json({ message: 'Approvals fetched', approvals: result });
    } catch (err) {
      console.error('OfferPackController.getByJob:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByToken(req, res) {
    try {
      const { token } = req.params;
      const result = await OfferPackService.getByToken(token);
      res.json({ message: 'Approval fetched', approval: result });
    } catch (err) {
      console.error('OfferPackController.getByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async decideByToken(req, res) {
    try {
      const { token } = req.params;
      const { decision, note } = req.body;
      const result = await OfferPackService.decideByToken(token, decision, note);
      res.json({ message: `Offer ${decision}`, approval: result });
    } catch (err) {
      console.error('OfferPackController.decideByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new OfferPackController();