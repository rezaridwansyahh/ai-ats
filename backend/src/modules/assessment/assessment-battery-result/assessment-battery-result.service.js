import AssessmentBatteryResult from './assessment-battery-result.model.js';
import sessionService from '../session/session.service.js';
import aiService from '../../../shared/services/ai.service.js';

const EDITABLE_FIELDS = ['profile', 'result', 'scores', 'report', 'recruiter_recommendation', 'recruiter_note'];
const JSON_FIELDS = ['profile', 'result', 'scores', 'report'];

function normaliseScores(battery, result) {
  if (!result) return null;
  if (result.scores && typeof result.scores === 'object') return result.scores;
  return null;
}

class AssessmentBatteryResultService {
  async getAll() {
    return await AssessmentBatteryResult.getAll();
  }

  async getById(id) {
    const result = await AssessmentBatteryResult.getById(id);
    if (!result) throw { status: 404, message: 'Assessment battery result not found' };
    return result;
  }

  async getByToken(token) {
    if (!token) throw { status: 400, message: 'token is required' };
    const result = await AssessmentBatteryResult.getByToken(token);
    if (!result) throw { status: 404, message: 'Assessment battery result not found' };
    return result;
  }

  async getBySessionId(session_id) {
    if (!session_id) throw { status: 400, message: 'session_id is required' };
    const result = await AssessmentBatteryResult.getBySessionId(session_id);
    if (!result) throw { status: 404, message: 'Assessment battery result not found' };
    return result;
  }

  async saveReport(session_id, report) {
    if (!report) throw { status: 400, message: 'report is required' };
    const session = await sessionService.getById(session_id);
    if (!session) throw { status: 404, message: 'Session not found' };

    const existing = await AssessmentBatteryResult.getBySessionId(session_id);
    if (!existing) throw { status: 404, message: 'No result for this session' };

    return await AssessmentBatteryResult.saveReport(session_id, report);
  }

  async updateRecruiterReview(session_id, { recruiter_recommendation, recruiter_note, report }) {
    const existing = await AssessmentBatteryResult.getBySessionId(session_id);
    if (!existing) throw { status: 404, message: 'No result for this session' };

    return await AssessmentBatteryResult.updateRecruiterReview(session_id, {
      recruiter_recommendation,
      recruiter_note,
      report,
    });
  }

  async generateReport(session_id) {
    const result = await AssessmentBatteryResult.getBySessionId(session_id);
    if (!result) throw { status: 404, message: 'No result for this session' };

    const session = await sessionService.getById(session_id);
    const report = await aiService.generateAssessmentReport({
      battery: session.battery,
      profile: result.profile,
      result: result.result,
      scores: result.scores,
    });

    return await AssessmentBatteryResult.saveReport(session_id, report);
  }

  async submitByToken(token, profile, result) {
    if (!token)   throw { status: 400, message: 'token is required' };
    if (!profile) throw { status: 400, message: 'profile is required' };
    if (!result)  throw { status: 400, message: 'result is required' };

    const session = await sessionService.getByToken(token);
    if (session.status === 'expired') throw { status: 410, message: 'Session has expired' };
    if (session.status === 'completed') throw { status: 409, message: 'Session is already completed' };

    const existing = await AssessmentBatteryResult.getBySessionId(session.id);
    if (existing) throw { status: 409, message: 'Result already submitted for this session' };

    const scores = normaliseScores(session.battery, result);

    const saved = await AssessmentBatteryResult.create({
      session_id: session.id,
      profile,
      result,
      scores,
    });

    await sessionService.markCompletedByToken(token);

    return { result: saved, scores };
  }

  async update(id, fields) {
    const existing = await AssessmentBatteryResult.getById(id);
    if (!existing) throw { status: 404, message: 'Result not found' };

    const allowed = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    for (const key of JSON_FIELDS) {
      if (allowed[key] !== undefined && allowed[key] !== null && typeof allowed[key] !== 'string') {
        allowed[key] = JSON.stringify(allowed[key]);
      }
    }

    return await AssessmentBatteryResult.update(id, allowed);
  }

  async delete(id) {
    const existing = await AssessmentBatteryResult.getById(id);
    if (!existing) throw { status: 404, message: 'Result not found' };
    await AssessmentBatteryResult.delete(id);
    return existing;
  }
}

export default new AssessmentBatteryResultService();
