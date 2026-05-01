import api from './axios';

export const getAssessmentResults = () => api.get('/assessment-battery-result');
export const getAssessmentResultById = (id) => api.get(`/assessment-battery-result/${id}`);
export const getAssessmentResultsByParticipant = (participant_id) =>
  api.get(`/assessment-battery-result/participant/${participant_id}`);
export const submitAssessment = (data) => api.post('/assessment-battery-result', data);
export const updateAssessmentReport = (id, data) =>
  api.put(`/assessment-battery-result/${id}/report`, data);
export const deleteAssessmentResult = (id) => api.delete(`/assessment-battery-result/${id}`);
