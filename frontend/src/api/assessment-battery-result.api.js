import api from './axios';

export const getAssessmentResults = () => api.get('/assessment-battery-result');
export const getAssessmentResultById = (id) => api.get(`/assessment-battery-result/${id}`);
export const getAssessmentResultsByParticipant = (participant_id) =>
  api.get(`/assessment-battery-result/participant/${participant_id}`);

// Recruiter candidate-detail: latest result for (candidate, battery). Returns
// { result: row | null }. Resolves candidate→applicant.email→participant on the server.
export const getResultFromCandidate = ({ candidate_id, battery }) =>
  api.get('/assessment-battery-result/from-candidate', { params: { candidate_id, battery } });
export const getActiveProgress = (participant_id, assessment_id) =>
  api.get(`/assessment-battery-result/participant/${participant_id}/active`, { params: { assessment_id } });
export const submitAssessment = (data) => api.post('/assessment-battery-result', data);
export const updateAssessmentReport = (id, data) =>
  api.put(`/assessment-battery-result/${id}/report`, data);
export const deleteAssessmentResult = (id) => api.delete(`/assessment-battery-result/${id}`);
