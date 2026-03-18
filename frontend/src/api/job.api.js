import api from './axios';

export const getJobs = () => api.get('/job');
export const getJobById = (id) => api.get(`/job/${id}`);
export const getJobsByStatus = (status) => api.get(`/job/status?status=${status}`);
export const getJobWithCandidates = (id) => api.get(`/job/${id}/candidates`);
export const createJob = (data) => api.post('/job', data);
export const updateJob = (id, data) => api.put(`/job/${id}`, data);
export const updateJobStatus = (id, status) => api.put(`/job/${id}/status`, { status });
export const deleteJob = (id) => api.delete(`/job/${id}`);
