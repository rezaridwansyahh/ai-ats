import SourcingModel from './sourcing.model.js';
import SourcingRecruiteModel from './sourcing-recruite.model.js';
import linkedinProducer from '../../bullmq/linkedin/linkedin.producer.js';
import JobSourceModel from '../job-source/job-source.model.js';
import ApplicantModel from '../applicant/applicant.model.js';
import { parseFileToText } from '../../shared/utils/file-parser.js';
import aiService from '../../shared/services/ai.service.js';

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

  async search({ account_id, job_title, location, skill, company, school, year_graduate, industry, keyword }) {
    if (!account_id) throw { status: 400, message: 'account_id is required' };

    const hasAtLeastOne = job_title || location || skill || company || school || year_graduate || industry || keyword;
    if (!hasAtLeastOne) {
      throw { status: 400, message: 'At least one search field is required' };
    }

    const fields = { account_id };
    const nextId = await SourcingModel.getNextId();
    fields.id = nextId;
    if (job_title)     fields.job_title = job_title;
    if (location)      fields.location = location;
    if (skill)         fields.skill = skill;
    if (company)       fields.company = company;
    if (school)        fields.school = school;
    if (year_graduate) fields.year_graduate = year_graduate;
    if (industry)      fields.industry = industry;
    if (keyword)       fields.keyword = keyword;

    const sourcing = await SourcingModel.create(fields);

    const dataForm = { job_title, location, skill, company, school, year_graduate, industry, keyword };
    const queued = await linkedinProducer.recruiteSearch(sourcing.id, account_id, dataForm);

    return { sourcing, queue_job_id: queued.id };
  }

  async updateStatus(id, status, error_message = null) {
    return await SourcingModel.updateStatus(id, status, error_message);
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

  // ─── CV Upload (Talent Pool) ───

  async uploadCv(file, companyId) {
    const fileType = file.originalname.toLowerCase().endsWith('.zip') ? 'zip' : 'pdf';

    // 1. Create batch tracking row (status = Processing)
    const batch = await SourcingModel.createBatch({
      company_id: companyId || null,
      filename:   file.originalname,
      file_type:  fileType,
    });

    try {
      // 2. Parse file text
      const cvText = await parseFileToText(file);
      if (!cvText || !cvText.trim()) {
        await SourcingModel.updateBatch(batch.id, { status: 'Failed', error_message: 'Could not extract text from the uploaded file' });
        throw { status: 400, message: 'Could not extract text from the uploaded PDF' };
      }

      // 3. AI: extract candidate fields + facets in one call
      const extracted = await aiService.extractCvForTalentPool(cvText, { company_id: companyId });

      // Fallback: derive name from filename if AI couldn't detect it
      const candidateName = extracted.name ||
        file.originalname
          .replace(/\.pdf$/i, '')
          .replace(/[-_]/g, ' ')
          .trim() ||
        'Unknown Candidate';

      // 4. Create internal core_job_sourcing record
      const sourcing = await JobSourceModel.create(
        null,
        null,
        'internal',
        extracted.last_position || 'Manual Upload',
        'Active',
        null
      );

      // 5. Insert applicant linked to the new sourcing + company
      const applicant = await ApplicantModel.create({
        job_sourcing_id: sourcing.id,
        company_id:      companyId || null,
        name:            candidateName,
        email:           extracted.email,
        last_position:   extracted.last_position,
        address:         extracted.address,
        education:       extracted.education_summary,
        information:     extracted.facets,
        date:            new Date(),
        attachment:      null,
      });

      // 6. Mark batch as Done, store candidate info for history display
      await SourcingModel.updateBatch(batch.id, {
        status:             'Done',
        processed_files:    1,
        applicant_name:     candidateName,
        applicant_position: extracted.last_position,
      });

      return { applicant: { ...applicant, name: candidateName }, sourcing, batch };
    } catch (err) {
      // Only update batch if not already marked failed above (status 400 = empty text)
      if (err.status !== 400) {
        await SourcingModel.updateBatch(batch.id, {
          status:        'Failed',
          error_message: err.message || 'Unknown error',
        });
      }
      throw err;
    }
  }

  async getUploadHistory(companyId, limit = 50) {
    return await SourcingModel.getBatchesByCompany(companyId, limit);
  }
}

export default new SourcingService();
