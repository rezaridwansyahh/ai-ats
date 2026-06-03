import jwt from 'jsonwebtoken';
import PortalQa from './portal-qa.model.js';
import {
  getApplicationFormTemplate,
  normalizeApplicationForm,
  findMissingRequired,
} from '../screening/screening-applicationForm.js';

const JWT_SECRET = process.env.JWT_SECRET;
const QA_TOKEN_TTL_SECONDS = 48 * 60 * 60; // 48h — matches the response window set at send time

// Accept a UUID token with or without dashes; reject anything else.
function isTokenFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

function isExpired(row) {
  return !!row.expired_at && new Date(row.expired_at) < new Date();
}

// Pair each submitted answer with its question (by index) so the recruiter inbox can
// render Q/A together. Accepts answers as strings or { answer } objects.
function normalizeAnswers(answers, questions) {
  if (!Array.isArray(answers)) return [];
  return questions.map((q, i) => {
    const a = answers[i];
    const answer = typeof a === 'string' ? a : (typeof a?.answer === 'string' ? a.answer : '');
    return { topic: q?.topic || '', question: q?.text || '', answer: answer.trim() };
  });
}

class PortalQaService {
  // Public summary for the candidate landing page (no PII, no questions).
  async getByToken(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid Q&A link.' };
    const row = await PortalQa.getByToken(token);
    if (!row) throw { status: 404, message: 'Invalid Q&A link.' };
    if (row.status === 'draft') throw { status: 403, message: 'This Q&A has not been sent yet.' };
    if (row.status !== 'responded' && isExpired(row)) {
      throw { status: 410, message: 'This Q&A link has expired.' };
    }
    return {
      job_title:     row.job_title,
      status:        row.status,
      expired_at:    row.expired_at,
      num_questions: row.num_questions ?? (Array.isArray(row.questions) ? row.questions.length : 0),
    };
  }

  // Email gate: match the candidate's applicant email, then mint a scoped JWT and return the questions.
  async verifyEmail(token, email) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid Q&A link.' };
    if (typeof email !== 'string' || !email.trim()) throw { status: 400, message: 'Email is required.' };

    const row = await PortalQa.getByToken(token);
    if (!row) throw { status: 404, message: 'Invalid Q&A link.' };
    if (row.status === 'draft') throw { status: 403, message: 'This Q&A has not been sent yet.' };
    if (row.status !== 'responded' && isExpired(row)) {
      throw { status: 410, message: 'This Q&A link has expired.' };
    }

    const expected = (row.candidate_email || '').trim().toLowerCase();
    const given    = email.trim().toLowerCase();
    if (!expected || expected !== given) {
      throw { status: 401, message: "Email doesn't match this invitation." };
    }

    const qaToken = jwt.sign(
      { screening_qa_id: row.id, scope: 'qa' },
      JWT_SECRET,
      { expiresIn: QA_TOKEN_TTL_SECONDS }
    );

    return {
      qa_token: qaToken,
      qa: {
        job_title:  row.job_title,
        status:     row.status,
        questions:  row.questions || [],
        answers:    row.answers || null,
        // Read-path fallback to the current template so a row with no snapshot
        // (legacy / pre-feature) can still render a form client-side.
        application_form_schema: row.application_form_schema || getApplicationFormTemplate(),
        application_form:        row.application_form || null,
        expired_at: row.expired_at,
      },
    };
  }

  // Guarded refresh — `screeningQaId` comes from the verified JWT, `token` from the URL.
  async getQuestions(token, screeningQaId) {
    const row = await this._loadGuarded(token, screeningQaId);
    return {
      job_title:  row.job_title,
      status:     row.status,
      questions:  row.questions || [],
      answers:    row.answers || null,
      application_form_schema: row.application_form_schema || getApplicationFormTemplate(),
      application_form:        row.application_form || null,
      expired_at: row.expired_at,
    };
  }

  async submit(token, screeningQaId, { answers, application_form } = {}) {
    const row = await this._loadGuarded(token, screeningQaId);
    if (row.status === 'responded') throw { status: 409, message: 'This Q&A has already been submitted.' };
    if (isExpired(row))             throw { status: 410, message: 'This Q&A link has expired.' };

    const questions = Array.isArray(row.questions) ? row.questions : [];

    // Application Form — validate ONLY against the schema frozen at send time.
    // No snapshot (legacy / pre-feature row) ⇒ skip form entirely (backward-compat).
    const schema = row.application_form_schema;
    let form = null;
    if (schema) {
      form = normalizeApplicationForm(schema, application_form);
      const missing = findMissingRequired(schema, form);
      if (missing.length) {
        throw {
          status: 400,
          message: `Missing required fields: ${missing.map((f) => f.label).join(', ')}`,
        };
      }
    }

    const cleaned = normalizeAnswers(answers, questions);
    if (questions.length > 0 && !cleaned.some((x) => x.answer.length > 0)) {
      throw { status: 400, message: 'At least one answer is required.' };
    }
    if (questions.length === 0 && !schema) {
      throw { status: 400, message: 'Nothing to submit.' };
    }

    const updated = await PortalQa.saveAnswers(row.id, cleaned, form);
    return { status: updated.status, responded_at: updated.responded_at };
  }

  async _loadGuarded(token, screeningQaId) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid Q&A link.' };
    const row = await PortalQa.getByToken(token);
    if (!row) throw { status: 404, message: 'Invalid Q&A link.' };
    if (row.id !== screeningQaId) throw { status: 403, message: 'Token does not match this session.' };
    return row;
  }
}

export default new PortalQaService();
