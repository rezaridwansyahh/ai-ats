import api from './axios';

// Upsert — saves this subtest's computed score once the candidate finishes it.
export const saveSubtestScore = ({ result_id, subtest_id, score }) =>
  api.post('/assessment-score', { result_id, subtest_id, score });

export const getScoresForResult = (result_id) => api.get(`/assessment-score/result/${result_id}`);
