import AssessmentScore from './assessment-score.model.js';

class AssessmentScoreService {
  async upsert({ result_id, subtest_id, score }) {
    if (!result_id) throw { status: 400, message: 'result_id is required' };
    if (!subtest_id) throw { status: 400, message: 'subtest_id is required' };
    if (score === undefined) throw { status: 400, message: 'score is required' };
    return await AssessmentScore.upsert({ result_id, subtest_id, score });
  }

  async getByResultId(result_id) {
    if (!result_id) throw { status: 400, message: 'result_id is required' };
    return await AssessmentScore.getByResultId(result_id);
  }
}

export default new AssessmentScoreService();
