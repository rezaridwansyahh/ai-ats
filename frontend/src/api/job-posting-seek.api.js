import api from './axios';

export const getSeekPostings = () => api.get('/seek');
export const getSeekPostingsByUserId = (userId) => api.get(`/job-posting/user/${userId}/full`);
export const getSeekPostingFull = (jobPostingId) => api.get(`/seek/posting/${jobPostingId}/full`);

export const submitSeekPosting = (data) => api.post('/seek/job-post-draft/rpa/create', data);

export const updateJobPosting = (data) => api.post('/seek/job-post-draft/rpa/update', data);

export const deleteJobPosting = (data) => api.post('/seek/job-post-draft/rpa/delete', data);

export const publishJob = (data) => api.post(`/job-posting/publish`, data);

export const getByJobId = (jobId) => api.get(`/job-posting/job/${jobId}`);

export const syncSeekJobPosts = (accountId) =>
  api.post('/seek/job-post/rpa/sync', { account_id: accountId });

export const checkConnection = (accountId) =>
  api.post('/seek/check-connection', { account_id: accountId });

export const extractSeekCandidates = (data) =>
  api.post('/seek/candidates/rpa/extract', data);

export const syncAll = (accountId) => 
  api.post('/seek/sync-all', { account_id: accountId });

export const getSeekJobStatus = (jobId) => api.get(`/seek/job-status/${jobId}`);
