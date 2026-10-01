import Recruiter from './recruiter.model.js';

class RecruiterService {
  async getAll(company_id) {
    return await Recruiter.getAllByCompanyId(company_id);
  }

  async getById(id) {
    const recruiter = await Recruiter.getById(id);
    if (!recruiter) throw { status: 404, message: 'Recruiter not found' };
    return recruiter;
  }

  async create({ name, email, jobs_assigned, status }, company_id) {
    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required' };
    }
    return await Recruiter.create(
      name,
      email,
      jobs_assigned || 0,
      status || 'Active',
      company_id
    );
  }

  async update(id, fields) {
    const recruiter = await Recruiter.getById(id);
    if (!recruiter) throw { status: 404, message: 'Recruiter not found' };

    const allowed = {};
    if (fields.name !== undefined) allowed.name = fields.name;
    if (fields.email !== undefined) allowed.email = fields.email;
    if (fields.jobs_assigned !== undefined) allowed.jobs_assigned = fields.jobs_assigned;
    if (fields.status !== undefined) allowed.status = fields.status;

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    return await Recruiter.update(id, allowed);
  }

  async delete(id) {
    const recruiter = await Recruiter.getById(id);
    if (!recruiter) throw { status: 404, message: 'Recruiter not found' };
    await Recruiter.delete(id);
    return recruiter;
  }
}

export default new RecruiterService();
