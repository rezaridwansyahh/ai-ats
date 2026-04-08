import api from './axios';

export const getSla = (jobId) => api.get(`/sla/${jobId}`);
export const saveSla = (jobId, data) => api.put(`/sla/${jobId}`, data);

