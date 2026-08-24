import api from './axios';

export const getByJobPostId = (jobPostId) => api.get(`/job-sourcing/jobPost/${jobPostId}`);
export const getByJobId = (jobId) => api.get(`/job-sourcing/job/${jobId}`);
export const getByAccountId = (accountId) => api.get(`/job-sourcing/account/${accountId}`);
export const getSources = () => api.get(`/job-sourcing/`);

export const linkToJob = (id, job_id) => api.put(`/job-sourcing/${id}/link`, { job_id });
export const unlinkFromJob = (id, job_id) => api.delete(`/job-sourcing/${id}/link/${job_id}`);
export const getLinkedJobs = (id) => api.get(`/job-sourcing/${id}/jobs`);