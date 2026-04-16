import AssessmentResult from './assessment-result.model.js';
import Participant from '../participant/participant.model.js';

const EDITABLE_FIELDS = ['score', 'answers'];

class AssessmentResultService {
  async getAll() {
    return await AssessmentResult.getAll();
  }

  async getById(id) {
    const result = await AssessmentResult.getById(id);
    if (!result) throw { status: 404, message: 'Assessment result not found' };
    return result;
  }

  async getByParticipantId(participant_id) {
    if (!participant_id) throw { status: 400, message: 'participant_id is required' };
    const result = await AssessmentResult.getByParticipantId(participant_id);
    if (!result) throw { status: 404, message: 'No assessment result for this participant' };
    return result;
  }

  async create(participant_id, score, answers) {
    if (!participant_id || score === undefined || score === null || !Number.isInteger(Number(score))) {
      throw { status: 400, message: 'participant_id and integer score are required' };
    }

    if (!answers || !Array.isArray(answers)) {
      throw { status: 400, message: 'answers must be a non-empty array' };
    }

    const participant = await Participant.getById(participant_id);
    if (!participant) throw { status: 404, message: 'Participant not found' };

    const existing = await AssessmentResult.getByParticipantId(participant_id);
    if (existing) {
      throw { status: 409, message: 'Participant has already completed an assessment (only one attempt allowed)' };
    }

    return await AssessmentResult.create({
      participant_id,
      score: Number(score),
      answers,
    });
  }

  async update(id, fields) {
    const result = await AssessmentResult.getById(id);
    if (!result) throw { status: 404, message: 'Assessment result not found' };

    const allowed = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    if (allowed.score !== undefined && !Number.isInteger(Number(allowed.score))) {
      throw { status: 400, message: 'score must be an integer' };
    }
    if (allowed.score !== undefined) allowed.score = Number(allowed.score);

    return await AssessmentResult.update(id, allowed);
  }

  async delete(id) {
    const result = await AssessmentResult.getById(id);
    if (!result) throw { status: 404, message: 'Assessment result not found' };
    await AssessmentResult.delete(id);
    return result;
  }
}

export default new AssessmentResultService();
