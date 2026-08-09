import jwt from 'jsonwebtoken';
import OfferPackService from './offer-pack.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

class OfferPackController {

  async decide(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { decision, note } = req.body;
      const result = await OfferPackService.decide(offer_id, decision, note, company_id, user_id);
      res.json({ message: `Offer ${decision}`, ...result });
    } catch (err) {
      console.error('OfferPackController.decide:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getStatus(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferPackService.getStatus(offer_id, company_id);
      res.json({ message: 'Approval status fetched', ...result });
    } catch (err) {
      console.error('OfferPackController.getStatus:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJob(req, res) {
    try {
      const { job_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferPackService.getByJob(job_id, company_id);
      res.json({ message: 'Approval statuses fetched', offers: result });
    } catch (err) {
      console.error('OfferPackController.getByJob:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async generateViewLink(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { expiry_days } = req.body;
      const result = await OfferPackService.generateViewLink(offer_id, expiry_days, company_id, user_id);
      res.status(201).json({ message: 'View link generated', ...result });
    } catch (err) {
      console.error('OfferPackController.generateViewLink:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getViewLinkBasic(req, res) {
    try {
      const result = await OfferPackService.getViewLinkBasic(req.params.token);
      res.json({ message: 'Link found', view: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async verifyViewLinkEmail(req, res) {
    try {
      const { email } = req.body || {};
      const result = await OfferPackService.verifyViewLinkEmail(req.params.token, email);
      res.json({ message: 'Email verified', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // Middleware — verify the offer_approval_view JWT
  async requireApprovalViewAuth(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Missing view token.' });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'offer_approval_view') {
        return res.status(403).json({ message: 'Wrong token scope.' });
      }
      req.approvalViewOfferId = payload.offer_id;
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired view token.' });
    }
  }

  async getSummary(req, res) {
    try {
      const result = await OfferPackService.getSummary(req.params.token, req.approvalViewOfferId);
      res.json({ message: 'Summary fetched', summary: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new OfferPackController();