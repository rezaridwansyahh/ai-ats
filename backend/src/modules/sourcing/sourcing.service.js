import SourcingModel from './sourcing.model.js';
import SourcingRecruiteModel from './sourcing-recruite.model.js';

class SourcingService {
  // ─── Sourcing ───

  async getAll() {
    return await SourcingModel.getAll();
  }

  async getById(id) {
    const sourcing = await SourcingModel.getById(id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    const recruites = await SourcingRecruiteModel.getBySourcingId(id);
    return { sourcing, recruites };
  }

  async create(data) {
    const { job_title, location, skills_and_assessments, companies, schools, year_graduate, industries, keywords } = data;

    const hasAtLeastOne = job_title || location || skills_and_assessments || companies || schools || year_graduate || industries || keywords;
    if (!hasAtLeastOne) {
      throw { status: 400, message: 'At least one search field is required' };
    }

    const fields = {};
    const nextId = await SourcingModel.getNextId();
    fields.id = nextId;
    if (job_title)              fields.job_title = job_title;
    if (location)               fields.location = location;
    if (skills_and_assessments) fields.skills_and_assessments = skills_and_assessments;
    if (companies)              fields.companies = companies;
    if (schools)                fields.schools = schools;
    if (year_graduate)          fields.year_graduate = year_graduate;
    if (industries)             fields.industries = industries;
    if (keywords)               fields.keywords = keywords;

    return await SourcingModel.create(fields);
  }

  async update(id, data) {
    const sourcing = await SourcingModel.getById(id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    const { job_title, location, skills_and_assessments, companies, schools, year_graduate, industries, keywords } = data;

    const fields = {};
    if (job_title !== undefined)              fields.job_title = job_title;
    if (location !== undefined)               fields.location = location;
    if (skills_and_assessments !== undefined) fields.skills_and_assessments = skills_and_assessments;
    if (companies !== undefined)              fields.companies = companies;
    if (schools !== undefined)                fields.schools = schools;
    if (year_graduate !== undefined)          fields.year_graduate = year_graduate;
    if (industries !== undefined)             fields.industries = industries;
    if (keywords !== undefined)               fields.keywords = keywords;

    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    return await SourcingModel.update(id, fields);
  }

  async delete(id) {
    const sourcing = await SourcingModel.getById(id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    await SourcingRecruiteModel.deleteBySourcingId(id);
    await SourcingModel.delete(id);
    return sourcing;
  }

  // ─── Sourcing Recruite ───

  async getRecruits(sourcing_id) {
    const sourcing = await SourcingModel.getById(sourcing_id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    return await SourcingRecruiteModel.getBySourcingId(sourcing_id);
  }

  async getRecruitById(sourcing_id, id) {
    const sourcing = await SourcingModel.getById(sourcing_id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    const recruit = await SourcingRecruiteModel.getById(id);
    if (!recruit || recruit.sourcing_id !== sourcing_id) {
      throw { status: 404, message: 'Recruit not found for this sourcing' };
    }
    return recruit;
  }

  async createRecruit(sourcing_id, data) {
    const sourcing = await SourcingModel.getById(sourcing_id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    const { job_title, information } = data;
    if (!job_title) throw { status: 400, message: 'job_title is required' };

    const nextId = await SourcingRecruiteModel.getNextId();
    return await SourcingRecruiteModel.create(nextId, sourcing_id, job_title, information);
  }

  async updateRecruit(sourcing_id, id, data) {
    const sourcing = await SourcingModel.getById(sourcing_id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    const recruit = await SourcingRecruiteModel.getById(id);
    if (!recruit || recruit.sourcing_id !== sourcing_id) {
      throw { status: 404, message: 'Recruit not found for this sourcing' };
    }

    const { job_title, information } = data;
    const fields = {};
    if (job_title !== undefined)   fields.job_title = job_title;
    if (information !== undefined)  fields.information = information;

    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    return await SourcingRecruiteModel.update(id, fields);
  }

  async deleteRecruit(sourcing_id, id) {
    const sourcing = await SourcingModel.getById(sourcing_id);
    if (!sourcing) throw { status: 404, message: 'Sourcing not found' };

    const recruit = await SourcingRecruiteModel.getById(id);
    if (!recruit || recruit.sourcing_id !== sourcing_id) {
      throw { status: 404, message: 'Recruit not found for this sourcing' };
    }

    await SourcingRecruiteModel.delete(id);
    return recruit;
  }
}

export default new SourcingService();
