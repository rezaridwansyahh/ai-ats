import AssessmentAnswer from './assessment-answer.model.js';

class AssessmentAnswerService {
  async upsert({ result_id, question_id, answer, is_correct, score_earned }) {
    if (!result_id) throw { status: 400, message: 'result_id is required' };
    if (!question_id) throw { status: 400, message: 'question_id is required' };
    if (answer === undefined) throw { status: 400, message: 'answer is required' };
    return await AssessmentAnswer.upsert({ result_id, question_id, answer, is_correct, score_earned });
  }

  async getByResultId(result_id) {
    if (!result_id) throw { status: 400, message: 'result_id is required' };
    return await AssessmentAnswer.getByResultId(result_id);
  }
}

export default new AssessmentAnswerService();
