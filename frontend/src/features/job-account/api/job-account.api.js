import api from "@/api/axios"

export const getJobAccountsByUserId = () => api.get(`/job-account`).then(res => res.data);
export const createJobAccount = (ctx) => api.post('/job-account', ctx).then(res => res.data);
export const updateJobAccount = (id, data) => api.put(`/job-account/${id}`, data).then(res => res.data);
export const deleteJobAccount = (id) => api.delete(`/job-account/${id}`).then(res => res.data);