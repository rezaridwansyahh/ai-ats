import CompanyModel from './company.model.js';
import userService from '../user/user.service.js';

class CompanyService {
  async getById(id) {
    const company = await CompanyModel.findById(id);

    return company;
  }

  // Platform-admin detail view: a single tenant plus its headcount.
  async getByIdDetail(id) {
    const company = await CompanyModel.findByIdWithUserCount(id);
    if (!company) throw { status: 404, message: 'Company not found' };
    return company;
  }

  async getAll() {
    return await CompanyModel.findAll();
  }

  // Platform-admin roster for one tenant — never expose the password hash
  // here even though the shared user-list query selects it.
  async getUsers(id) {
    const users = await userService.getAllWithRoles(id);
    return users.map(({ password, ...rest }) => rest);
  }

  async create(payload) {
    if (!payload?.name) throw { status: 400, message: 'name is required' };
    return await CompanyModel.create(payload);
  }

  async update(id, payload) {
    const allowed = ['name', 'description', 'email', 'website', 'logo_url'];
    const fields = {};
    for (const k of allowed) {
      if (payload[k] !== undefined) fields[k] = payload[k];
    }
    return await CompanyModel.update(id, fields);
  }

  async delete(id) {
    const existing = await CompanyModel.findById(id);
    if (!existing) throw { status: 404, message: 'Company not found' };
    return await CompanyModel.delete(id);
  }
}

export default new CompanyService();