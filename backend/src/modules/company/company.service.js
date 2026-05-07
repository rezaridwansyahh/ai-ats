import CompanyModel from './company.model.js';

class CompanyService {
  async getAll() {
    return await CompanyModel.getAll();
  }

  async getById(id) {
    const company = await CompanyModel.getById(id);
    if (!company) throw { status: 404, message: 'Company not found' };
    return company;
  }

  async create(payload) {
    if (!payload?.name) throw { status: 400, message: 'name is required' };
    return await CompanyModel.create(payload);
  }

  async update(id, payload) {
    const existing = await CompanyModel.getById(id);
    if (!existing) throw { status: 404, message: 'Company not found' };
    const allowed = ['name', 'description', 'email', 'website', 'logo_url'];
    const fields = {};
    for (const k of allowed) {
      if (payload[k] !== undefined) fields[k] = payload[k];
    }
    return await CompanyModel.update(id, fields);
  }

  async delete(id) {
    const existing = await CompanyModel.getById(id);
    if (!existing) throw { status: 404, message: 'Company not found' };
    return await CompanyModel.delete(id);
  }
}

export default new CompanyService();
