import CandidatePipeline from './candidate-pipeline.model.js';
import { sendScreeningEmail } from '../../shared/services/candidate-mailer.js';
import screeningService from '../screening/screening.service.js';
import getDb from '../../config/postgres.js';
import interviewModel from '../interview/interview.model.js';
import backgroundCheckModel from '../background-check/background-check.model.js';

class CandidatePipelineService {
  async getAll() {
    return await CandidatePipeline.getAll();
  }

  async getById(id) {
    const pipeline = await CandidatePipeline.getById(id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };
    return pipeline;
  }

  async getSummary(query) {
    const { category } = query
    if(category) return await CandidatePipeline.getSummaryFiltered(category);
    return await CandidatePipeline.getSummary();
  }

  async getByJobId(job_id, query) {
    const { category } = query
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    if(category) return await CandidatePipeline.getByJobIdCategory(job_id, category);
    return await CandidatePipeline.getByJobId(job_id);
  }

  async getByApplicantId(applicant_id) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    return await CandidatePipeline.getByApplicantId(applicant_id);
  }

  async create({ applicant_id, job_id }) {
    if (!applicant_id) throw { status: 400, message: 'applicant_id is required' };
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    try {
      const candidate = await CandidatePipeline.createFromApplicant(applicant_id, job_id);
      if (!candidate) {
        throw { status: 404, message: 'Applicant not found' };
      }
      return candidate;
    } catch (err) {
      if (err.code === '23505') {
        throw { status: 409, message: 'This applicant is already a candidate for this job' };
      }
      if (err.code === '23503') {
        throw { status: 400, message: 'Invalid applicant_id or job_id' };
      }
      throw err;
    }
  }

  async update(id, fields) {
    const pipeline = await CandidatePipeline.getById(id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };

    const allowed = {};
    if (fields.latest_stage !== undefined) allowed.latest_stage = fields.latest_stage;

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    return await CandidatePipeline.update(id, allowed);
  }

  async delete(id) {
    const pipeline = await CandidatePipeline.getById(id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };
    await CandidatePipeline.delete(id);
    return pipeline;
  }

  async getStages(pipeline_id) {
    const pipeline = await CandidatePipeline.getById(pipeline_id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };
    return await CandidatePipeline.getStages(pipeline_id);
  }

  async ScreeningEmail(candidate_id, decision) {
    if (decision?.result !== "match") return

    const ctx = await CandidatePipeline.getNotificationContext(candidate_id)
    if (!ctx || !ctx.email_notify) return

    await sendScreeningEmail({
      candidateName: ctx.candidate_name,
      candidateEmail: ctx.candidate_email,
      jobTitle: ctx.job_title,
      stageName: "Screening",
    })
  }

  async email(candidate_id, { stageName } = {}) {
    const ctx = await CandidatePipeline.getNotificationContext(candidate_id);
    if (!ctx) throw { status: 404, message: 'Candidate not found' };
    if (!ctx.candidate_email) {
      throw { status: 400, message: `Candidate "${ctx.candidate_name}" has no email on the linked applicant` };
    }

    await sendScreeningEmail({
      candidateName: ctx.candidate_name,
      candidateEmail: ctx.candidate_email,
      jobTitle: ctx.job_title,
      stageName: stageName || 'Screening',
    });

    return {
      sent_to: ctx.candidate_email,
      candidate_name: ctx.candidate_name,
      job_title: ctx.job_title,
      stage_name: stageName || 'Screening',
    };
  }

  async addStage(candidate_id, job_stage_id, decision) {
    if (!job_stage_id) throw { status: 400, message: 'job_stage_id is required' };

    const listStages = await CandidatePipeline.getListStages(candidate_id);
    const currentStagesIndex = listStages.findIndex(s => s.id === job_stage_id);
    const nextStageId = listStages[currentStagesIndex + 1]?.id
      ? listStages[currentStagesIndex + 1].id
      : listStages[currentStagesIndex].id;

    const result = await CandidatePipeline.addStage(candidate_id, nextStageId, decision);

    // Fire side-effects based on the category of the new stage.
    // Errors here must not roll back the stage advance itself.
    try {
      const catRow = await getDb().query(
        `SELECT rsc.name AS category
           FROM job_stage js
           JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
          WHERE js.id = $1`,
        [nextStageId]
      );
      const category = catRow.rows[0]?.category || '';

      if (category === 'Interview') {
        // Ensure a candidate_interview row exists so the candidate is visible
        // in the interview workboard immediately after advancing.
        await interviewModel.ensureInterviewForCandidate(candidate_id);
      } else if (category === 'Background Check') {
        // Ensure a candidate_bg row exists so the candidate is visible
        // in the background-check workboard.
        await backgroundCheckModel.getByCandidateId(candidate_id);
      }
    } catch (sideEffectErr) {
      console.error('addStage side-effect error:', sideEffectErr?.message || sideEffectErr);
    }

    return result;
  }

  async getProgress(candidate_id) {
    const pipeline = await CandidatePipeline.getById(candidate_id);
    if (!pipeline) throw { status: 404, message: 'Candidate pipeline not found' };

    const result = await CandidatePipeline.getProgress(candidate_id);

    return result;
  }
}

export default new CandidatePipelineService();
