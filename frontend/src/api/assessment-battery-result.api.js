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
// Creates (or returns the existing) result row before any subtest is answered,
// so assessment_answer/assessment_score saves have a real result_id to point at
// from the very first question — otherwise that row wouldn't exist until submit().
export const startAssessmentAttempt = ({ candidate_id, assessment_id }) =>
  api.post('/assessment-battery-result/start', { candidate_id, assessment_id });

export const submitAssessment = (data) => api.post('/assessment-battery-result', data);
export const updateAssessmentReport = (id, data) =>
  api.put(`/assessment-battery-result/${id}/report`, data);

// Fire-and-forget Battery A AI report (re)generation. Server flips ai_report_status
// to 'pending' synchronously and runs the LLM in the background; poll
// getResultFromCandidate to see 'completed' or 'failed'.
export const regenerateNarrative = (id) =>
  api.post(`/assessment-battery-result/${id}/regenerate-narrative`);

export const deleteAssessmentResult = (id) => api.delete(`/assessment-battery-result/${id}`);

// Server-generated (pdfmake) PDF export of the report — replaces window.print().
export const downloadReportPdf = (id) =>
  api.get(`/assessment-battery-result/${id}/pdf`, { responseType: 'blob' });
