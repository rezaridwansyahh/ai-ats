import api from "@/api/axios"

export const getJobAccountsByUserId = (platform) => api.get(`/account`, { params: { platform } }).then(res => res.data);
export const createJobAccount = (ctx) => api.post('/account', ctx).then(res => res.data);
export const updateJobAccount = (id, data) => api.put(`/account/${id}`, data).then(res => res.data);
export const deleteJobAccount = (id) => api.delete(`/account/${id}`).then(res => res.data);
export const checkAccountConnection = (id) => api.post(`/account/${id}/check-connection`).then(res => res.data);
export const syncAccountJobSource = (id) => api.post(`/account/${id}/sync-job-source`).then(res => res.data);
export const extractAccountCandidates = (id, job_sourcing_id) =>
  api.post(`/account/${id}/extract-candidates/${job_sourcing_id}`).then(res => res.data);