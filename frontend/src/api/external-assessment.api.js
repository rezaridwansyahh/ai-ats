import api from './axios';

export const getExternalAssessment = ({ candidate_id, job_id }) =>
  api.get('/external-assessment/by-candidate', { params: { candidate_id, job_id } });

export const previewExternalInvitation = ({ candidate_id, job_id, assessment_url }) =>
  api.post('/external-assessment/preview', { candidate_id, job_id, assessment_url });

export const sendExternalInvitation = ({ candidate_id, job_id, assessment_url, subject, body }) =>
  api.post('/external-assessment/send', { candidate_id, job_id, assessment_url, subject, body });

export const recordExternalDecision = (id, decision) =>
  api.post(`/external-assessment/${id}/decision`, { decision });
