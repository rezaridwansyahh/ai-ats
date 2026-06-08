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

  async getBudget(req, res) {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'company_id is required' });

      const budget = await companyUsageService.getCurrentBudget(company_id);
      const spent = await companyUsageService.getMonthToDateSpend(company_id);
      const remaining = budget.budget_usd - spent;
      const percentUsed = (spent / budget.budget_usd) * 100;

      res.status(200).json({
        budget: Number(budget.budget_usd),
        spent: Number(spent),
        remaining: Number(remaining),
        percentUsed: Math.round(percentUsed),
        monthYear: budget.month_year,
        alert80Sent: budget.alert_80_sent
      });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateBudget(req, res) {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'company_id is required' });

      const { budget_usd } = req.body;
      if (!budget_usd || budget_usd <= 0) {
        return res.status(400).json({ message: 'budget_usd must be a positive number' });
      }

      const updated = await companyUsageService.updateCurrentBudget(company_id, budget_usd);
      res.status(200).json({ message: 'Budget updated successfully', budget: updated });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new CompanyUsageController();
