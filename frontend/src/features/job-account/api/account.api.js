import api from "@/api/axios"

export const getJobAccountsByUserId = () => api.get(`/account`).then(res => res.data);
export const createJobAccount = (ctx) => api.post('/account', ctx).then(res => res.data);
export const updateJobAccount = (id, data) => api.put(`/account/${id}`, data).then(res => res.data);
export const deleteJobAccount = (id) => api.delete(`/account/${id}`).then(res => res.data);