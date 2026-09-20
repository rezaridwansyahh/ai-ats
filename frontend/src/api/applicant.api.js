import api from './axios';

export const getAll = () => api.get('/applicant');
export const getAllByCompany = (company_id) => api.get(`/applicant/company/${company_id}`);
export const getAllByCompanyWithScore = (company_id) => api.get(`/applicant/score/company/${company_id}`);

//Baru punya BAYU
export const getByJobSourcingId = (job_sourcing_id) => api.get(`/applicant/job-sourcing/${job_sourcing_id}`);