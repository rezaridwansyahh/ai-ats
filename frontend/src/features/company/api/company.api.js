import api from "@/api/axios"

export const getCompany = () => api.get('/company/me').then(res => res.data);

// Every tenant plus a user headcount — Super Admin only.
export const getAllCompanies = () => api.get('/company').then(res => res.data);

export const updateCompany = (data) => api.put(`/company/me`, data).then(res => res.data);