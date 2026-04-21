import JobModel from './job.model.js';

class JobService {
  async getAll() {
    return await JobModel.getAll();
  }

  async getById(id) {
    const job = await JobModel.getById(id);
    if (!job) throw { status: 404, message: 'Job not found' };
    return job;
  }

  async getByStatus(status) {
    const validStatuses = ['Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: `status must be one of: ${validStatuses.join(', ')}` };
    }
    return await JobModel.getByStatus(status);
  }

  async getWithCandidates(id) {
    const job = await JobModel.getWithCandidates(id);
    if (!job) throw { status: 404, message: 'Job not found' };
    return job;
  }

  async create(data) {
    const { job_title, job_desc, job_location, work_option, work_type,
            pay_type, currency, pay_min, pay_max, pay_display,
            company, seniority_level, company_url,
            qualifications, required_skills, preferred_skills, benefits,
            sla_start_date, sla_end_date } = data;

    if (!job_title) throw { status: 400, message: 'job_title is required' };

    const fields = {};
    if (job_title) fields.job_title = job_title;
    if (job_desc) fields.job_desc = job_desc;
    if (job_location) fields.job_location = job_location;
    if (work_option) fields.work_option = work_option;
    if (work_type) fields.work_type = work_type;
    if (pay_type) fields.pay_type = pay_type;
    if (currency) fields.currency = currency;
    if (pay_min != null) fields.pay_min = pay_min;
    if (pay_max != null) fields.pay_max = pay_max;
    if (pay_display) fields.pay_display = pay_display;
    if (company) fields.company = company;
    if (seniority_level) fields.seniority_level = seniority_level;
    if (company_url) fields.company_url = company_url;
    if (qualifications) fields.qualifications = qualifications;
    if (required_skills) fields.required_skills = JSON.stringify(required_skills);
    if (preferred_skills) fields.preferred_skills = JSON.stringify(preferred_skills);
    if (benefits) fields.benefits = JSON.stringify(benefits);
    if (sla_start_date) fields.sla_start_date = sla_start_date;
    if (sla_end_date) fields.sla_end_date = sla_end_date;

    return await JobModel.create(fields);
  }

  async update(id, data) {
    const job = await JobModel.getById(id);
    if (!job) throw { status: 404, message: 'Job not found' };

    const allowedFields = ['job_title', 'job_desc', 'job_location', 'work_option', 'work_type',
                           'pay_type', 'currency', 'pay_min', 'pay_max', 'pay_display',
                           'company', 'seniority_level', 'company_url', 'status',
                           'qualifications', 'required_skills', 'preferred_skills', 'benefits',
                           'sla_start_date', 'sla_end_date'];

    const jsonFields = new Set(['required_skills', 'preferred_skills', 'benefits']);

    const fields = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (jsonFields.has(key) && typeof data[key] !== 'string') {
          fields[key] = JSON.stringify(data[key]);
        } else {
          fields[key] = data[key];
        }
      }
    }

    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    return await JobModel.update(id, fields);
  }

  async updateStatus(id, status) {
    const validStatuses = ['Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: `status must be one of: ${validStatuses.join(', ')}` };
    }

    const job = await JobModel.getById(id);
    if (!job) throw { status: 404, message: 'Job not found' };

    return await JobModel.updateStatus(id, status);
  }

  async delete(id) {
    const job = await JobModel.getById(id);
    if (!job) throw { status: 404, message: 'Job not found' };
    await JobModel.delete(id);
    return job;
  }
}

export default new JobService();
