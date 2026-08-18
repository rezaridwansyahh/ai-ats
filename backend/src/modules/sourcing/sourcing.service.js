import fs from 'fs';
import os from 'os';
import path from 'path';
import SourcingModel from './sourcing.model.js';
import SourcingRecruiteModel from './sourcing-recruite.model.js';
import linkedinProducer from '../../bullmq/linkedin/linkedin.producer.js';
import cvProducer from '../../bullmq/cv/cv.producer.js';
import ApplicantModel from '../applicant/applicant.model.js';
import aiService from '../../shared/services/ai.service.js';
import companyService from '../company/company.service.js';


// ── Save an uploaded PDF buffer to permanent disk storage, return its path ──
function saveCvBuffer(buffer, companyId, companyName, applicant) {
  const safeCompanyName = (companyName || 'unknown').replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const companyFolder = `${companyId}_${safeCompanyName}`;

  const uploadsDir = path.join(process.cwd(), 'uploads', 'cv', companyFolder);
  fs.mkdirSync(uploadsDir, { recursive: true });

  const savedFilename = `${applicant.id}_${applicant.name}.pdf`;
  const savedPath = path.join(uploadsDir, savedFilename);

  fs.writeFileSync(savedPath, buffer);
  return savedPath;
}

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
    const isZip = file.originalname.toLowerCase().endsWith('.zip');
    const fileType = isZip ? 'zip' : 'pdf';

    if (isZip) {
      return await this._uploadZip(file, companyId);
    }

    // ── Single PDF flow ───────────────────────────────────────────────────────
    const batch = await SourcingModel.createBatch({
      company_id:  companyId || null,
      filename:    file.originalname,
      file_type:   fileType,
      total_files: 1,
    });

    try {
      // Send PDF buffer directly to OpenAI — no local text extraction needed
      const extracted = await aiService.extractCvForTalentPool(file.buffer, file.originalname, { company_id: companyId });

      const candidateName = extracted.name ||
        file.originalname.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim() ||
        'Unknown Candidate';

      // Create applicant first (without attachment) so we have its id to name the file with
      const applicant = await ApplicantModel.create({
        upload_batch_id:  batch.id,
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

      // Look up company name for a readable folder name (falls back gracefully if missing)
      let companyName = 'unknown';
      if (companyId) {
        try {
          const company = await companyService.getById(companyId);
          companyName = company.name;
        } catch {
          // company lookup failing shouldn't block the CV upload
        }
      }

      // Now save the file using the applicant's real id, then persist the path
      const savedPath = saveCvBuffer(file.buffer, companyId, companyName, applicant);
      await ApplicantModel.updateAttachment(applicant.id, savedPath);
      applicant.attachment = savedPath;

      await SourcingModel.updateBatch(batch.id, {
        status:             'Done',
        processed_files:    1,
        applicant_name:     candidateName,
        applicant_position: extracted.last_position,
      });

      return { applicant: { ...applicant, name: candidateName }, batch };
    } catch (err) {
      await SourcingModel.updateBatch(batch.id, { status: 'Failed', error_message: err.message || 'Unknown error' });
      throw err;
    }
  }

  // ── ZIP: save to temp file, enqueue, return immediately ─────────────────
  async _uploadZip(file, companyId) {
    // Write buffer to a temp file so the worker can read it outside the request
    const tempFilePath = path.join(os.tmpdir(), `cv-zip-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`);
    fs.writeFileSync(tempFilePath, file.buffer);

    // Create batch row with status Processing — worker will update it
    const batch = await SourcingModel.createBatch({
      company_id:  companyId || null,
      filename:    file.originalname,
      file_type:   'zip',
      total_files: 1, // worker will update once it knows the real count
    });

    // Enqueue and return immediately — no waiting
    await cvProducer.processZip({ batchId: batch.id, tempFilePath, companyId: companyId || null });

    return { batch, queued: true };
  }

  async getUploadHistory(companyId, limit = 50) {
    return await SourcingModel.getBatchesByCompany(companyId, limit);
  }
}

export default new SourcingService();