import api from "@/api/axios"

export const getCompany = () => api.get('/company/me').then(res => res.data);

// Every tenant plus a user headcount — Super Admin only.
export const getAllCompanies = () => api.get('/company').then(res => res.data);

export const updateCompany = (data) => api.put(`/company/me`, data).then(res => res.data);

// Super Admin only — platform-level tenant management (not the current
// user's own company, see getCompany/updateCompany above).
export const createCompany = (data) => api.post('/company', data).then(res => res.data);
export const getCompanyById = (id) => api.get(`/company/${id}`).then(res => res.data);
export const updateCompanyById = (id, data) => api.put(`/company/${id}`, data).then(res => res.data);
export const getCompanyUsers = (id) => api.get(`/company/${id}/users`).then(res => res.data);