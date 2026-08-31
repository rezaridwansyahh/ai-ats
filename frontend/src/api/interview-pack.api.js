import api from './axios';

// Admin (authenticated)
export const createInterviewPack = (data) => api.post('/interview-pack', data);
export const getInterviewPacks   = ()     => api.get('/interview-pack');
export const getInterviewPack    = (id)   => api.get(`/interview-pack/${id}`);
export const deleteInterviewPack = (id)   => api.delete(`/interview-pack/${id}`);

// Portal (public — uses same axios instance but token is optional)
export const getPackByToken  = (token)                        => api.get(`/portal-interview/${token}`);
export const saveOutcome     = (token, packCandidateId, data) => api.put(`/portal-interview/${token}/outcome/${packCandidateId}`, data);
export const submitPack      = (token)                        => api.post(`/portal-interview/${token}/submit`);
export const downloadPackCandidateCv = (token, packCandidateId) =>
  api.get(`/portal-interview/${token}/candidate/${packCandidateId}/cv`, { responseType: 'blob' });
