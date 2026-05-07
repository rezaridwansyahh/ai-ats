import companyService from './company.service.js';

class CompanyController {
  async getAll(req, res) {
    try {
      const companies = await companyService.getAll();
      res.status(200).json({ message: 'List companies', companies });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const company = await companyService.getById(Number(req.params.id));
      res.status(200).json({ message: 'Company details', company });
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
      const company = await companyService.update(Number(req.params.id), req.body || {});
      res.status(200).json({ message: 'Company updated', company });
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
