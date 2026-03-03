import api from './axios.js';

export const getCandidatesByJobPostingId = (job_posting_id) =>
  api.get(`/candidate/job-posting/${job_posting_id}`);

export const updateCandidateStatus = (id, status) =>
  api.put(`/candidate/${id}/status`, { status });

export const deleteCandidate = (id) =>
  api.delete(`/candidate/${id}`);

export const downloadCandidateCv = (id) =>
  api.get(`/candidate/${id}/cv`, { responseType: 'blob' });
