import companyUsageService from './company-usage.service.js';

class CompanyUsageController {
  async list(req, res) {
    try {
      // Default to caller's company unless an admin explicitly passes ?company_id=
      const company_id = req.query.company_id
        ? Number(req.query.company_id)
        : req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'company_id is required' });

      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const since = req.query.since || null;
      const rows = await companyUsageService.list(company_id, { limit, since });
      res.status(200).json({ message: 'Company usage', rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async summary(req, res) {
    try {
      const company_id = req.query.company_id
        ? Number(req.query.company_id)
        : req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'company_id is required' });

      const since = req.query.since || null;
      const rows = await companyUsageService.summary(company_id, { since });
      res.status(200).json({ message: 'Company usage summary', rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new CompanyUsageController();
