import api from './axios';

// Upsert — saves or overwrites this candidate's answer for one question.
export const saveAnswer = ({ result_id, question_id, answer, is_correct, score_earned }) =>
  api.post('/assessment-answer', { result_id, question_id, answer, is_correct, score_earned });

export const getAnswersForResult = (result_id) => api.get(`/assessment-answer/result/${result_id}`);
