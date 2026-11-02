import AssessmentScore from './assessment-score.model.js';
import AssessmentAnswer from '../assessment-answer/assessment-answer.model.js';
import Question from '../question/question.model.js';
import { scoreSubtest } from '../../../shared/services/assessment-scoring/index.js';

class AssessmentScoreService {
  // `score` is still accepted in the payload for backwards compatibility
  // (older clients, and the client's own instant-feedback UI still posts it)
  // but is no longer trusted — the server recomputes it from the same
  // assessment_answer rows it already holds, using the exact same scoring
  // logic as the frontend. This is what actually closes the stale-closure
  // timer bug: even if the client's `answers` state was wrong at scoring
  // time, the server derives the score from what was genuinely persisted
  // per-question, not from whatever the client happened to compute.
  async upsert({ result_id, subtest_id }) {
    if (!result_id) throw { status: 400, message: 'result_id is required' };
    if (!subtest_id) throw { status: 400, message: 'subtest_id is required' };

    const subtest = await Question.getSubtestById(subtest_id);
    if (!subtest) throw { status: 404, message: 'Subtest not found' };

    const items = await Question.getQuestionsBySubtestId(subtest_id);
    if (!items.length) throw { status: 404, message: 'No questions found for this subtest' };

    const answerRows = await AssessmentAnswer.getByResultIdAndSubtestId(result_id, subtest_id);
    const answersByOrderIndex = {};
    answerRows.forEach((r) => { answersByOrderIndex[r.order_index] = r.answer; });

    const score = scoreSubtest({
      assessment_id: subtest.assessment_id,
      subtest_key: subtest.subtest_key,
      group_key: subtest.group_key,
      items,
      answersByOrderIndex,
    });

    return await AssessmentScore.upsert({ result_id, subtest_id, score });
  }

  async getByResultId(result_id) {
    if (!result_id) throw { status: 400, message: 'result_id is required' };
    return await AssessmentScore.getByResultId(result_id);
  }
}

export default new AssessmentScoreService();
