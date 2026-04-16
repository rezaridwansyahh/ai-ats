import api from './axios';

export const getQuestions = () => api.get('/question');
export const getQuestionById = (id) => api.get(`/question/${id}`);
export const createQuestion = (data) => api.post('/question', data);
export const updateQuestion = (id, data) => api.put(`/question/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/question/${id}`);
