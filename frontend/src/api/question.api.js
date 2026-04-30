import api from './axios';

export const getAssessments = () => api.get('/question');
export const getAssessmentById = (id) => api.get(`/question/${id}`);
export const getQuestionsByAssessmentCode = (code) => api.get(`/question/assessment/${code}`);
export const getSubtestQuestions = (code, subtest) => api.get(`/question/assessment/${code}/subtest/${subtest}`);
