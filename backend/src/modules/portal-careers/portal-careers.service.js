import companyModel from '../company/company.model.js';
import jobModel from '../job/job.model.js';
import applicantModel from '../applicant/applicant.model.js';
import candidatePipelineService from '../candidate-pipeline/candidate-pipeline.service.js';
import aiService from '../../shared/services/ai.service.js';
import { saveCvBuffer } from '../../shared/utils/cv-storage.js';
import { sendPlainEmail } from '../../shared/services/candidate-mailer.js';

// Loose but real — matches the mockup's own WhatsApp-number validation.
const PHONE_RE = /^(\+62|62|0)8\d{7,12}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One shared platform-wide reCAPTCHA v2 (checkbox) pair, not per-tenant —
// every company's career page lives on this same domain, so a single
// Google reCAPTCHA registration already covers all of them. Optional: with
// no keys set, the feature is simply off and the apply form works without it.
async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return true; // not configured anywhere — nothing to enforce
  if (!token) return false;

  const params = new URLSearchParams({ secret: secretKey, response: token });
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  return !!data.success;
}

function publicCompany(c) {
  return { name: c.name, slug: c.slug, description: c.description, logo_url: c.logo_url, website: c.website };
}

// pay_display is the job's own "Show"/"Hide" toggle — only expose pay fields
// publicly when the recruiter opted in, same as the internal UI already respects.
function publicJob(j) {
  const showPay = j.pay_display === 'Show';
  return {
    id: j.id,
    job_title: j.job_title,
    job_desc: j.job_desc,
    qualifications: j.qualifications,
    required_skills: j.required_skills,
    preferred_skills: j.preferred_skills,
    job_location: j.job_location,
    work_option: j.work_option,
    work_type: j.work_type,
    seniority_level: j.seniority_level,
    status: j.status,
    created_at: j.created_at,
    pay_type: showPay ? j.pay_type : null,
    currency: showPay ? j.currency : null,
    pay_min: showPay ? j.pay_min : null,
    pay_max: showPay ? j.pay_max : null,
  };
}

class PortalCareersService {
  // Never returns the secret key — only whether the widget should render
  // and which public site key to render it with.
  getRecaptchaConfig() {
    const siteKey = process.env.RECAPTCHA_SITE_KEY;
    const enabled = !!(siteKey && process.env.RECAPTCHA_SECRET_KEY);
    return { enabled, siteKey: enabled ? siteKey : null };
  }

  async getCompanyCareers(slug) {
    const company = await companyModel.findBySlug(slug);
    if (!company) throw { status: 404, message: 'Company not found' };

    const jobs = await jobModel.getByStatus('Active', company.id);
    return { company: publicCompany(company), jobs: jobs.map(publicJob) };
  }

  async getJobDetail(slug, job_id) {
    const company = await companyModel.findBySlug(slug);
    if (!company) throw { status: 404, message: 'Company not found' };

    const job = await jobModel.getById(job_id);
    if (!job || job.company_id !== company.id) throw { status: 404, message: 'Job not found' };

    return { company: publicCompany(company), job: publicJob(job) };
  }

  async submitApplication(slug, job_id, fields, file) {
    const company = await companyModel.findBySlug(slug);
    if (!company) throw { status: 404, message: 'Company not found' };

    const job = await jobModel.getById(job_id);
    if (!job || job.company_id !== company.id) throw { status: 404, message: 'Job not found' };
    if (job.status !== 'Active') throw { status: 409, message: 'This position is no longer accepting applications' };

    // Honeypot — a hidden field no human ever fills in; bots that fill every
    // input in the form trip it.
    if (fields.website) throw { status: 400, message: 'Invalid submission' };

    // reCAPTCHA — only enforced when both keys are actually configured
    // (verifyRecaptcha no-ops to true otherwise), so this never blocks
    // submissions on a deployment that hasn't opted in yet.
    if (process.env.RECAPTCHA_SECRET_KEY) {
      const recaptchaValid = await verifyRecaptcha(fields.recaptcha_token);
      if (!recaptchaValid) throw { status: 400, message: 'reCAPTCHA verification failed. Please try again.' };
    }

    const name = (fields.name || '').trim();
    const email = (fields.email || '').trim();
    const phone = (fields.phone || '').trim().replace(/[\s-]/g, '');

    if (!name) throw { status: 400, message: 'Name is required' };
    if (!EMAIL_RE.test(email)) throw { status: 400, message: 'A valid email is required' };
    if (!PHONE_RE.test(phone)) throw { status: 400, message: 'A valid WhatsApp number is required' };
    if (!file) throw { status: 400, message: 'A resume/CV is required' };

    // Best-effort — the form only collects name/email/phone directly, so this
    // backfills last_position/address/education (NOT NULL-ish on the applicant
    // row) and feeds AI Screening's facets. A parse failure shouldn't block
    // the application itself.
    let extracted = {};
    try {
      extracted = await aiService.extractCvForTalentPool(file.buffer, file.originalname, { company_id: company.id });
    } catch (err) {
      console.error('[portal-careers] CV parse failed, continuing without it:', err.message);
    }

    const information = {
      ...(extracted.facets || {}),
      linkedin_url: fields.linkedin_url || null,
      salary_expectation: fields.salary_expectation || null,
      source: fields.source === 'linkedin' ? 'linkedin' : 'career_site',
    };

    const applicant = await applicantModel.create({
      company_id: company.id,
      name,
      email,
      phone,
      last_position: extracted.last_position || 'Not specified',
      address: fields.city || extracted.address || 'Not specified',
      education: extracted.education_summary || null,
      information,
      date: new Date(),
      attachment: null,
    });

    const savedPath = saveCvBuffer(file.buffer, company.id, company.name, applicant.id, applicant.name);
    await applicantModel.updateAttachment(applicant.id, savedPath);

    try {
      await candidatePipelineService.create({ applicant_id: applicant.id, job_id: job.id });
    } catch (err) {
      // Re-applying to a job they're already in the pipeline for isn't a hard
      // failure — the applicant row above is still updated with their latest CV.
      if (err.status !== 409) throw err;
    }

    const reference = `APL-${job.id}-${applicant.id}`;

    sendPlainEmail({
      candidateName: name,
      candidateEmail: email,
      subject: `Application received — ${job.job_title}`,
      body: `Hi ${name},\n\nThank you for applying to ${job.job_title} at ${company.name}. We've received your application (ref: ${reference}) and will be in touch if your profile is a good fit.\n\nBest,\n${company.name} Recruitment Team`,
    }).catch((err) => console.error('[portal-careers] confirmation email failed:', err.message));

    return { reference };
  }
}

export default new PortalCareersService();
