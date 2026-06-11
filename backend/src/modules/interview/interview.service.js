import interviewModel from './interview.model.js';
import jobModel from '../job/job.model.js';
import aiService from '../../shared/services/ai.service.js';

class InterviewService {
  async getWorkboard(company_id) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    return await interviewModel.getWorkboardData(company_id);
  }

  async getInterview(interview_id, { company_id = null } = {}) {
    if (!interview_id) throw { status: 400, message: 'interview_id is required' };
    const row = await interviewModel.getById(interview_id);
    if (!row) throw { status: 404, message: 'Interview not found' };
    if (company_id && row.company_id && row.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    return row;
  }

  async getInterviewByCandidateId(candidate_id, { company_id = null } = {}) {
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };
    const row = await interviewModel.ensureInterviewForCandidate(candidate_id);
    if (company_id && row.company_id && row.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    return row;
  }

  async getInterviewsByJob(job_id, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };
    if (company_id && job.company_id && job.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    return await interviewModel.getByJob(job_id);
  }

  async updateStatus(interview_id, { status, company_id = null } = {}) {
    if (!interview_id) throw { status: 400, message: 'interview_id is required' };
    const valid = ['ongoing', 'scheduled', 'in_batch', 'scored', 'decided', 'done'];
    if (!valid.includes(status)) {
      throw { status: 400, message: `status must be one of: ${valid.join(', ')}` };
    }
    const existing = await interviewModel.getById(interview_id);
    if (!existing) throw { status: 404, message: 'Interview not found' };
    if (company_id && existing.company_id && existing.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    return await interviewModel.updateInterviewStatus(interview_id, status);
  }

  async getSchedules(interview_id, { company_id = null } = {}) {
    if (!interview_id) throw { status: 400, message: 'interview_id is required' };
    const interview = await interviewModel.getById(interview_id);
    if (!interview) throw { status: 404, message: 'Interview not found' };
    if (company_id && interview.company_id && interview.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    return await interviewModel.getSchedulesByInterview(interview_id);
  }

  async createSchedule(interview_id, { title, description, scheduled_at, company_id = null, created_by = null } = {}) {
    if (!interview_id) throw { status: 400, message: 'interview_id is required' };
    if (!title || !title.trim()) throw { status: 400, message: 'title is required' };
    if (!scheduled_at) throw { status: 400, message: 'scheduled_at is required' };

    const interview = await interviewModel.getById(interview_id);
    if (!interview) throw { status: 404, message: 'Interview not found' };
    if (company_id && interview.company_id && interview.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }

    // enforce max 3 sessions per candidate interview
    const count = await interviewModel.countSchedules(interview_id);
    if (count >= 3) {
      throw { status: 400, message: 'Maximum 3 sessions per candidate interview' };
    }

    const schedule = await interviewModel.createSchedule({
      interview_id,
      company_id: company_id || interview.company_id || null,
      title: title.trim(),
      description: description || null,
      scheduled_at,
      created_by,
    });

    // sync candidate_interview.scheduled_at to next upcoming session
    await interviewModel.syncScheduledAt(interview_id);

    return schedule;
  }

  async updateSchedule(schedule_id, fields, { company_id = null } = {}) {
    if (!schedule_id) throw { status: 400, message: 'schedule_id is required' };

    const existing = await interviewModel.getScheduleById(schedule_id);
    if (!existing) throw { status: 404, message: 'Schedule not found' };

    // tenant guard via parent interview
    if (company_id) {
      const interview = await interviewModel.getById(existing.interview_id);
      if (interview?.company_id && interview.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    // only allow updating title, description, scheduled_at
    const allowed = {};
    if (fields.title       !== undefined) allowed.title        = fields.title.trim();
    if (fields.description !== undefined) allowed.description  = fields.description || null;
    if (fields.scheduled_at !== undefined) allowed.scheduled_at = fields.scheduled_at;

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    const updated = await interviewModel.updateSchedule(schedule_id, allowed);

    await interviewModel.syncScheduledAt(existing.interview_id);
    return updated;
  }

  async confirmSchedule(schedule_id, { confirmed_by = null, confirmation_note = null, company_id = null } = {}) {
    if (!schedule_id) throw { status: 400, message: 'schedule_id is required' };

    const existing = await interviewModel.getScheduleById(schedule_id);
    if (!existing) throw { status: 404, message: 'Schedule not found' };

    if (company_id) {
      const interview = await interviewModel.getById(existing.interview_id);
      if (interview?.company_id && interview.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    if (existing.confirmed) return existing; 
    return await interviewModel.confirmSchedule(schedule_id, {
      confirmed_by,
      confirmation_note,
    });
  }

  async unconfirmSchedule(schedule_id, { company_id = null } = {}) {
    if (!schedule_id) throw { status: 400, message: 'schedule_id is required' };

    const existing = await interviewModel.getScheduleById(schedule_id);
    if (!existing) throw { status: 404, message: 'Schedule not found' };

    if (company_id) {
      const interview = await interviewModel.getById(existing.interview_id);
      if (interview?.company_id && interview.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    if (!existing.confirmed) return existing; 

    return await interviewModel.unconfirmSchedule(schedule_id);
  }

  async deleteSchedule(schedule_id, { company_id = null } = {}) {
    if (!schedule_id) throw { status: 400, message: 'schedule_id is required' };

    const existing = await interviewModel.getScheduleById(schedule_id);
    if (!existing) throw { status: 404, message: 'Schedule not found' };

    if (company_id) {
      const interview = await interviewModel.getById(existing.interview_id);
      if (interview?.company_id && interview.company_id !== company_id) {
        throw { status: 403, message: 'Cross-tenant access denied' };
      }
    }

    // block deletion of confirmed sessions — must unconfirm first
    if (existing.confirmed) {
      throw { status: 400, message: 'Cannot delete a confirmed session — unconfirm it first' };
    }

    const deleted = await interviewModel.deleteSchedule(schedule_id);

    // re-sync scheduled_at on parent after removal
    await interviewModel.syncScheduledAt(existing.interview_id);

    return deleted;
  }

  async getPrep(job_id, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const job = await jobModel.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };
    if (company_id && job.company_id && job.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    return await interviewModel.getPrepByJob(job_id);
  }

  async generateQuestions(job_id, { num_questions, language, company_id = null } = {}, context = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };

    const ctx = await interviewModel.getPrepContext(job_id);
    const job = ctx
      ? { job_title: ctx.job_title, job_desc: ctx.job_desc, required_skills: ctx.required_skills, preferred_skills: ctx.preferred_skills, qualifications: ctx.qualifications }
      : await jobModel.getById(job_id);

    if (!job) throw { status: 404, message: 'Job not found' };

    if (ctx?.rubric_locked) {
      throw { status: 400, message: 'Rubric is locked — unlock it before regenerating questions' };
    }

    const aiContext = {
      ...context,
      metadata: { job_id, ...(context.metadata || {}) },
    };

    const { questions } = await aiService.generateInterviewQuestions(
      job,
      { numQuestions: num_questions, language },
      aiContext
    );

    const existingRubric = ctx?.rubric_items || [];

    return await interviewModel.upsertPrep({
      job_id,
      company_id: company_id || job.company_id || null,
      questions,
      rubric_items: existingRubric,
      created_by: context.user_id || null,
    });
  }

  async updateQuestions(job_id, questions, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    if (!Array.isArray(questions) || questions.length === 0) {
      throw { status: 400, message: 'questions[] is required' };
    }

    const prep = await interviewModel.getPrepByJob(job_id);
    if (!prep) throw { status: 404, message: 'No prep found for this job — generate first' };
    if (company_id && prep.company_id && prep.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    if (prep.rubric_locked) {
      throw { status: 400, message: 'Rubric is locked — unlock it before editing questions' };
    }

    const clean = questions
      .filter((q) => q && typeof q === 'object' && typeof q.text === 'string' && q.text.trim())
      .map((q) => ({
        id:         q.id ?? null,
        competency: typeof q.competency === 'string' ? q.competency.trim() : null,
        source:     q.source === 'open' ? 'open' : 'jd_generated',
        text:       q.text.trim(),
        follow_up:  typeof q.follow_up === 'string' ? q.follow_up.trim() : null,
      }));

    if (clean.length === 0) throw { status: 400, message: 'No valid questions provided' };

    const updated = await interviewModel.updatePrepQuestions(job_id, clean);
    if (!updated) throw { status: 404, message: 'Prep not found' };
    return updated;
  }

  async updateRubric(job_id, rubric_items, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    if (!Array.isArray(rubric_items) || rubric_items.length === 0) {
      throw { status: 400, message: 'rubric_items[] is required' };
    }

    const prep = await interviewModel.getPrepByJob(job_id);
    if (!prep) throw { status: 404, message: 'No prep found for this job — generate first' };
    if (company_id && prep.company_id && prep.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    if (prep.rubric_locked) {
      throw { status: 400, message: 'Rubric is locked — unlock it before editing' };
    }

    this._validateRubricItems(rubric_items);

    const updated = await interviewModel.updatePrepRubric(job_id, rubric_items);
    if (!updated) throw { status: 404, message: 'Prep not found' };
    return updated;
  }

  async lockRubric(job_id, { locked_by = null, company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const prep = await interviewModel.getPrepByJob(job_id);
    if (!prep) throw { status: 404, message: 'No prep found for this job — generate first' };
    if (company_id && prep.company_id && prep.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    if (prep.rubric_locked) return prep;
    if (!prep.rubric_items || prep.rubric_items.length === 0) {
      throw { status: 400, message: 'Cannot lock an empty rubric — add rubric items first' };
    }
    if (!prep.questions || prep.questions.length === 0) {
      throw { status: 400, message: 'Cannot lock — no questions generated yet' };
    }
    return await interviewModel.lockRubric(job_id, locked_by);
  }

  async unlockRubric(job_id, { company_id = null } = {}) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    const prep = await interviewModel.getPrepByJob(job_id);
    if (!prep) throw { status: 404, message: 'No prep found for this job' };
    if (company_id && prep.company_id && prep.company_id !== company_id) {
      throw { status: 403, message: 'Cross-tenant access denied' };
    }
    if (!prep.rubric_locked) return prep;
    return await interviewModel.unlockRubric(job_id);
  }


  _validateRubricItems(rubric_items) {
    for (const item of rubric_items) {
      if (!item.competency_code || typeof item.competency_code !== 'string') {
        throw { status: 400, message: 'each rubric item needs a competency_code string' };
      }
      if (!item.competency_name || typeof item.competency_name !== 'string') {
        throw { status: 400, message: 'each rubric item needs a competency_name string' };
      }
      const weight = Number(item.weight);
      if (!Number.isFinite(weight) || weight <= 0) {
        throw { status: 400, message: `rubric item "${item.competency_code}" weight must be a positive number` };
      }
    }
  }
}

export default new InterviewService();