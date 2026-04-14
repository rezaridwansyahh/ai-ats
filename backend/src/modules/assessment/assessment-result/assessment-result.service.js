import AssessmentResult from './assessment-result.model.js';
import Participant from '../participant/participant.model.js';
import Instructor from '../instructor/instructor.model.js';

const EDITABLE_FIELDS = ['test_name', 'date_test', 'score', 'instructor_id'];

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

  async getByInstructorId(instructor_id) {
    if (!instructor_id) throw { status: 400, message: 'instructor_id is required' };
    return await AssessmentResult.getByInstructorId(instructor_id);
  }

  async create(participant_id, instructor_id, test_name, date_test, score) {
    if (!participant_id || !instructor_id || !test_name || !date_test || score === undefined || score === null || !Number.isInteger(Number(score))) {
      throw { status: 400, message: 'participant_id, instructor_id, test_name, date_test, and integer score are required' };
    }

    const participant = await Participant.getById(participant_id);
    if (!participant) throw { status: 404, message: 'Participant not found' };

    const instructor = await Instructor.getById(instructor_id);
    if (!instructor) throw { status: 404, message: 'Instructor not found' };

    const existing = await AssessmentResult.getByParticipantId(participant_id);
    if (existing) {
      throw { status: 409, message: 'Participant has already completed an assessment (only one attempt allowed)' };
    }

    return await AssessmentResult.create({
      participant_id,
      instructor_id,
      test_name,
      date_test,
      score: Number(score),
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

    if (allowed.instructor_id !== undefined) {
      const instructor = await Instructor.getById(allowed.instructor_id);
      if (!instructor) throw { status: 404, message: 'Instructor not found' };
    }

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
