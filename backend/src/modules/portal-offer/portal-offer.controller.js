import jwt from 'jsonwebtoken';
import PortalOfferService from './portal-offer.service.js';

class PortalOfferController {
  
  async sendOfferLetter(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await PortalOfferService.sendOfferLetter(offer_id, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in sendOfferLetter:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }
  
  async resendOffer(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await PortalOfferService.resendOffer(offer_id, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in resendOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }
  
  async getSendHistory(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await PortalOfferService.getSendHistory(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getSendHistory:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }
}

export default new PortalOfferController();