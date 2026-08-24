import EmailTemplateService from './email-template.service.js';

class EmailTemplateController {
  async getAll(req, res) {
    try {
      const { company_id } = req.user;
      const result = await EmailTemplateService.getAllForCompany(company_id);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async save(req, res) {
    try {
      const { company_id, user_id } = req.user;
      const { stage_type_id, template_key } = req.params;
      const { subject, body } = req.body;
      const result = await EmailTemplateService.save(company_id, Number(stage_type_id), template_key, subject, body, user_id);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  }
}

export default new EmailTemplateController();