import api from './axios';

export const getSeekPostings = () => api.get('/seek');
export const getSeekPostingsByUserId = (userId) => api.get(`/job-posting/user/${userId}/full`);
export const getSeekPostingFull = (jobPostingId) => api.get(`/seek/posting/${jobPostingId}/full`);

export const submitSeekPosting = (data) => api.post('/seek/job-post-draft/rpa/create', data);

export const updateJobPosting = (data) => api.post('/seek/job-post-draft/rpa/update', data);

export const deleteJobPosting = (data) => api.post('/seek/job-post-draft/rpa/delete', data);

export const syncSeekJobPosts = (accountId) =>
  api.post('/seek/job-post/rpa/sync', { account_id: accountId });

export const extractSeekCandidates = (data) =>
  api.post('/seek/candidates/rpa/extract', data);
