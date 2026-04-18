import api from './axios';

export const getByJobPostId = (jobPostId) => api.get(`/job-sourcing/jobPost/${jobPostId}`);
export const getSources = () => api.get(`/job-sourcing/`);