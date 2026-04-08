import api from './axios';

export const getJobPostings = () => api.get('/job-posting');
export const getJobPostingById = (id) => api.get(`/job-posting/${id}`);

export const getJobPostingByJobId = (job_id) => api.get(`/job-posting/job/${job_id}`);

export const getJobPostingsByUserId = (userId) => api.get(`/job-posting/user/${userId}`);
export const getJobPostingFullById = (id) => api.get(`/job-posting/${id}/full`);
export const getSeekPostingsByUserId = (userId) => api.get(`/job-posting/user/${userId}/full`);

export const submitSeekPosting = (data) => api.post('/job-posting/seek', data);

export const updateJobPosting       = (id, data) => api.put(`/job-posting/${id}`, data);
export const updateJobPostingStatus = (id, data) => api.put(`/job-posting/${id}/status`, data);
export const updateSeekDetails      = (jobPostingId, data) => api.put(`/seek/posting/${jobPostingId}`, data);

export const deleteJobPosting = (id) => api.delete(`/job-posting/${id}`);
