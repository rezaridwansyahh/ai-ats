import api from './axios';

export const getAll = () => api.get('/applicant');
export const getAllByCompany = (company_id) => api.get(`/applicant/company/${company_id}`);
export const getAllByCompanyWithScore = (company_id, params = {}) =>
  api.get(`/applicant/score/company/${company_id}`, { params });
export const getApplicantStats = (company_id) => api.get(`/applicant/stats/company/${company_id}`);
export const getApplicantSkills = (company_id) => api.get(`/applicant/skills/company/${company_id}`);

//Baru punya BAYU
export const getByJobSourcingId = (job_sourcing_id) => api.get(`/applicant/job-sourcing/${job_sourcing_id}`);
export const getScoreHistory = (applicant_id) => api.get(`/applicant/${applicant_id}/score-history`);