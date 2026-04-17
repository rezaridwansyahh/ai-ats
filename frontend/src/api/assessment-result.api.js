import api from './axios';

export const getAssessmentResults = () => api.get('/assessment-result');
export const getAssessmentResultById = (id) => api.get(`/assessment-result/${id}`);
export const getAssessmentResultByParticipant = (participant_id) => api.get(`/assessment-result/participant/${participant_id}`);
export const createAssessmentResult = (data) => api.post('/assessment-result', data);
export const updateAssessmentResult = (id, data) => api.put(`/assessment-result/${id}`, data);
export const deleteAssessmentResult = (id)=> api.delete(`/assessment-result/${id}`);
