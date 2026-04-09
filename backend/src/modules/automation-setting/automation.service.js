import Automation from './automation.model.js';

class AutomationService {
  async getAll() {
    return await Automation.getAll();
  }

  async getByJobId(jobId) {
    const automation = await Automation.getByJobId(jobId);
    if (!automation) throw { status: 404, message: 'Automation setting not found' };
    return automation;
  }

  async create({ job_id, ai_screening, ai_follow_up, auto_schedule, auto_reject, auto_advance, email_notify, reject_threshold, advance_threshold }) {
    if (reject_threshold !== undefined) {
      const val = Number(reject_threshold);
      if (!Number.isInteger(val) || val < 0 || val > 100) {
        throw { status: 400, message: 'reject_threshold must be an integer between 0 and 100' };
      }
    }

    if (advance_threshold !== undefined) {
      const val = Number(advance_threshold);
      if (!Number.isInteger(val) || val < 0 || val > 100) {
        throw { status: 400, message: 'advance_threshold must be an integer between 0 and 100' };
      }
    }

    return await Automation.create(
      job_id,
      ai_screening,
      ai_follow_up,
      auto_schedule,
      auto_reject,
      auto_advance,
      email_notify,
      reject_threshold,
      advance_threshold
    );
  }

  async update(jobId, fields) {
    const automation = await Automation.getByJobId(jobId);
    if (!automation) throw { status: 404, message: 'Automation setting not found' };

    const allowed = {};
    if (fields.ai_screening !== undefined) allowed.ai_screening = fields.ai_screening;
    if (fields.ai_follow_up !== undefined) allowed.ai_follow_up = fields.ai_follow_up;
    if (fields.auto_schedule !== undefined) allowed.auto_schedule = fields.auto_schedule;
    if (fields.auto_reject !== undefined) allowed.auto_reject = fields.auto_reject;
    if (fields.auto_advance !== undefined) allowed.auto_advance = fields.auto_advance;
    if (fields.email_notify !== undefined) allowed.email_notify = fields.email_notify;
    if (fields.reject_threshold !== undefined) allowed.reject_threshold = fields.reject_threshold;
    if (fields.advance_threshold !== undefined) allowed.advance_threshold = fields.advance_threshold;

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    return await Automation.update(automation.id, allowed);
  }
}

export default new AutomationService();
