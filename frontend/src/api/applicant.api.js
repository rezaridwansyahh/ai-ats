import api from './axios';

export const getAll = () => api.get('/applicant');
export const getAllByCompany = (job_id) => api.get(`/applicant/company/${job_id}`);