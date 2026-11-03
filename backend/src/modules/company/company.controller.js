import companyService from './company.service.js';

class CompanyController {
  getCompanyDetail = async (req, res) => {
    try {
      const company = await companyService.getById(req.user.company_id);
      res.json(company);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const company = await companyService.create(req.body || {});
      res.status(201).json({ message: 'Company created', company });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const company = await companyService.update(req.user.company_id, req.body || {});
      res.json(company)
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const company = await companyService.delete(Number(req.params.id));
      res.status(200).json({ message: 'Company deleted', company });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new CompanyController();
