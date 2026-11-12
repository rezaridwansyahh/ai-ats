import ExternalAssessment from './external.model.js';
import candidatePipelineService from '../../candidate-pipeline/candidate-pipeline.service.js';
import { sendTemplatedEmail, sendPlainEmail } from '../../../shared/services/candidate-mailer.js';
import EmailTemplateService, { STAGE_ASSESSMENT } from '../../email-template/email-template.service.js';

const VALID_DECISIONS = ['advance', 'hold', 'reject'];
const LOCKED_DECISIONS = ['advance', 'reject'];

class ExternalAssessmentService {
  async getByCandidateJob(candidate_id, job_id) {
    if (!candidate_id || !job_id) throw { status: 400, message: 'candidate_id and job_id are required' };
    return await ExternalAssessment.getByCandidateJob(candidate_id, job_id);
  }

  async previewInvitation({ candidate_id, job_id, assessment_url, company_id }) {
    if (!assessment_url?.trim()) throw { status: 400, message: 'assessment_url is required' };

    const ctx = await ExternalAssessment.getCandidateContext(candidate_id, job_id);
    if (!ctx?.candidate_email) {
      throw { status: 400, message: `Candidate "${ctx?.candidate_name || candidate_id}" has no email on file` };
    }

    const resolvedCompanyId = company_id ?? ctx.company_id;
    const template = await EmailTemplateService.getResolved(resolvedCompanyId, STAGE_ASSESSMENT, 'invite_external');
    const vars = {
      CANDIDATE_NAME: ctx.candidate_name,
      JOB_TITLE: ctx.job_title || 'the position',
    };

    const interpolate = (str) => {
      let out = str;
      for (const [key, val] of Object.entries(vars)) {
        out = out.replaceAll(`{{${key.toUpperCase()}}}`, val ?? '');
      }
      return out.replace(/\{\{LINK\}\}/g, assessment_url);
    };

    return {
      to: ctx.candidate_email,
      subject: interpolate(template.subject),
      body: interpolate(template.body),
    };
  }

  // `subject`/`body`, when provided, are the admin's edited version of the
  // preview — sent verbatim (this send only, never written back to the
  // Settings template). Omitting them falls back to the resolved template,
  // same as every other invite flow in the app.
  async sendInvitation({ candidate_id, job_id, assessment_url, sent_by, company_id, subject, body }) {
    if (!assessment_url?.trim()) throw { status: 400, message: 'assessment_url is required' };

    const existing = await ExternalAssessment.getByCandidateJob(candidate_id, job_id);
    if (existing?.status === 'decided') {
      throw { status: 409, message: 'A decision has already been recorded — cannot resend' };
    }

    const ctx = await ExternalAssessment.getCandidateContext(candidate_id, job_id);
    if (!ctx?.candidate_email) {
      throw { status: 400, message: `Candidate "${ctx?.candidate_name || candidate_id}" has no email on file` };
    }

    const resolvedCompanyId = company_id ?? ctx.company_id;
    const row = await ExternalAssessment.upsert({ candidate_id, job_id, company_id: resolvedCompanyId, assessment_url });

    if (subject?.trim() && body?.trim()) {
      await sendPlainEmail({
        candidateName: ctx.candidate_name,
        candidateEmail: ctx.candidate_email,
        subject: subject.trim(),
        body: body.trim(),
      });
    } else {
      const template = await EmailTemplateService.getResolved(resolvedCompanyId, STAGE_ASSESSMENT, 'invite_external');
      await sendTemplatedEmail({
        candidateName: ctx.candidate_name,
        candidateEmail: ctx.candidate_email,
        template,
        link: assessment_url,
        vars: {
          CANDIDATE_NAME: ctx.candidate_name,
          JOB_TITLE: ctx.job_title || 'the position',
        },
      });
    }

    const sent = await ExternalAssessment.markSent(row.id, sent_by);
    return { sent_to: ctx.candidate_email, record: sent };
  }

  async _advancePipeline(candidate_id, decisionLabel) {
    try {
      const pipeline = await candidatePipelineService.getById(candidate_id);
      if (pipeline?.latest_stage) {
        await candidatePipelineService.addStage(candidate_id, pipeline.latest_stage, decisionLabel);
      }
    } catch (err) {
      console.error(`Failed to advance pipeline for candidate ${candidate_id}:`, err?.message || err);
    }
  }

  async recordDecision(id, { decision, decided_by }) {
    if (!VALID_DECISIONS.includes(decision)) {
      throw { status: 400, message: `decision must be one of ${VALID_DECISIONS.join(', ')}` };
    }

    const record = await ExternalAssessment.getById(id);
    if (!record) throw { status: 404, message: 'External assessment record not found' };
    if (LOCKED_DECISIONS.includes(record.decision)) {
      throw { status: 409, message: `Decision already recorded as "${record.decision}" and cannot be changed` };
    }

    const updated = await ExternalAssessment.recordDecision(id, { decision, decided_by });

    // Mirrors interview.service.js / background-check.service.js: only the
    // positive decision moves the pipeline stage forward. Reject records the
    // outcome but does not advance — same as 'rejected'/'fail' elsewhere.
    if (decision === 'advance') {
      await this._advancePipeline(record.candidate_id, decision);
    }

    return updated;
  }
}

export default new ExternalAssessmentService();
