import api from './axios';

export const getAll = () => api.get('/applicant'); 

export const getAllByCompanyId = (companyId) => api.get(`/applicant/company/${companyId}`);