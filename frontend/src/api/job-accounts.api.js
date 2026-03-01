import api from './axios';

export const getJobAccounts = () => api.get('/job-account');
export const getJobAccountById = (id) => api.get(`/job-account/${id}`);
export const getJobAccountsByUserId = (userId) => api.get(`/job-account/user/${userId}`);
export const createJobAccount = (data) => api.post('/job-account', data);
export const updateJobAccount = (id, data) => api.put(`/job-account/${id}`, data);
export const deleteJobAccount = (id) => api.delete(`/job-account/${id}`);
