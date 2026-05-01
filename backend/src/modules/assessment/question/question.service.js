import Question from './question.model.js';

class QuestionService {
  async getAllAssessments() {
    return await Question.getAllAssessments();
  }

  async getById(id) {
    const assessment = await Question.getById(id);
    if (!assessment) throw { status: 404, message: 'Assessment not found' };
    return assessment;
  }

  async getByAssessmentCode(code) {
    if (!code) throw { status: 400, message: 'assessment_code is required' };
    const assessment = await Question.getByAssessmentCode(code);
    if (!assessment) throw { status: 404, message: 'Assessment not found' };
    return assessment;
  }

  async getQuestionsByCode(code) {
    if (!code) throw { status: 400, message: 'assessment_code is required' };
    const questions = await Question.getQuestionsByCode(code);
    if (!questions) throw { status: 404, message: 'Assessment not found' };
    return questions;
  }

  async getSubtestByCode(code, subtest) {
    if (!code) throw { status: 400, message: 'assessment_code is required' };
    if (!subtest) throw { status: 400, message: 'subtest is required' };
    const row = await Question.getSubtestByCode(code, subtest);
    if (!row) throw { status: 404, message: 'Assessment not found' };

    const knownSubtests = Array.isArray(row.subtests) ? row.subtests : [];
    if (knownSubtests.length && !knownSubtests.includes(subtest)) {
      throw { status: 400, message: `Unknown subtest. Expected one of: ${knownSubtests.join(', ')}` };
    }
    if (!row.items) throw { status: 404, message: 'No questions for this subtest' };
    return row.items;
  }
}

export default new QuestionService();
