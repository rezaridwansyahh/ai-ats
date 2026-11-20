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

  getAll = async (req, res) => {
    try {
      const companies = await companyService.getAll();
      res.json(companies);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  getById = async (req, res) => {
    try {
      const company = await companyService.getByIdDetail(Number(req.params.id));
      res.json(company);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  getUsers = async (req, res) => {
    try {
      const users = await companyService.getUsers(Number(req.params.id));
      res.json(users);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateById(req, res) {
    try {
      const company = await companyService.update(Number(req.params.id), req.body || {});
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
