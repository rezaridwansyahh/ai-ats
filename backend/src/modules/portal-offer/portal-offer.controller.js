import jwt from 'jsonwebtoken';
import PortalOfferService from './portal-offer.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

class PortalOfferController {

  async getByToken(req, res) {
    try {
      const result = await PortalOfferService.getByToken(req.params.token);
      res.status(200).json({ message: 'Offer found', offer: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body || {};
      const result = await PortalOfferService.verifyEmail(req.params.token, email);
      res.status(200).json({ message: 'Email verified', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async requireOfferAuth(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Missing offer token.' });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'offer_send') {
        return res.status(403).json({ message: 'Wrong token scope.' });
      }
      req.offerSendId = payload.offer_send_id;
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired offer token.' });
    }
  }

  async getOffer(req, res) {
    try {
      const result = await PortalOfferService.getOffer(req.params.token, req.offerSendId);
      res.status(200).json({ message: 'Offer fetched', offer: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async sign(req, res) {
    try {
      const result = await PortalOfferService.sign(req.params.token, req.offerSendId);
      res.status(200).json({ message: 'Offer signed', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PortalOfferController();