import api from './axios';

export const getAllCompanies = ()    => api.get('/company');
export const getCompanyById  = (id)  => api.get(`/company/${id}`);
