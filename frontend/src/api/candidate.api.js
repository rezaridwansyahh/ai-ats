import api from './axios.js';

export const getCandidatesByJobPostingId = (job_posting_id) =>
  api.get(`/candidate/job-posting/${job_posting_id}`);

export const updateCandidateStatus = (id, status) =>
  api.put(`/candidate/${id}/status`, { status });

export const deleteCandidate = (id) =>
  api.delete(`/candidate/${id}`);

export const getAll = () =>
  api.get(`/candidate-pipeline/`);

export const downloadCandidateCv = (id) =>
  api.get(`/candidate/${id}/cv`, { responseType: 'blob' });

export const addApplicantToJob = (applicant_id, job_id) =>
  api.post(`/candidate-pipeline`, { applicant_id, job_id });

export const getCandidatesByApplicantId = (applicant_id) =>
  api.get(`/candidate-pipeline/applicant/${applicant_id}`);

export const sendCandidateEmail = (candidate_id, body = {}) =>
  api.post(`/candidate-pipeline/${candidate_id}/email`, body);

// Report page: per-job candidate counts for the left rail.
export const getCandidatePipelineSummary = (category = null) => {
  let url = '/candidate-pipeline/summary'

  if(category) url += `?category=${category}`;

  return api.get(url);
}

// Report page: candidates attached to a job.
export const getCandidatesByJobId = (job_id, category = null) => {
  let url = `/candidate-pipeline/job/${job_id}`;

  if(category) url += `?category=${category}`;

  return api.get(url);
}

// Detail page: single candidate by master_candidate.id.
export const getCandidateById = (id) =>
  api.get(`/candidate-pipeline/${id}`);

export const getProgress = (id) =>
  api.get(`/candidate-pipeline/${id}/progress`);

export const addCandidateStage = (candidateId, job_stage_id, decision) =>
  api.post(`/candidate-pipeline/${candidateId}/stages`, { job_stage_id, decision });
