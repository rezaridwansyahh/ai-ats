import api from "@/api/axios"

export const getCompany = () => api.get('/company/me').then(res => res.data);

export const updateCompany = (data) => api.put(`/company/me`, data).then(res => res.data);