import offerTemplateService from './offer-template.service.js';

class OfferTemplateController {
  async getTemplate(req, res) {
    try {
      const { company_id } = req.user;
      const template = await offerTemplateService.getTemplate(company_id);
      res.status(200).json({ message: 'Offer letter template', template });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async uploadTemplate(req, res) {
    try {
      const { company_id, user_id } = req.user;
      const result = await offerTemplateService.uploadTemplate(company_id, user_id, req.file);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new OfferTemplateController();