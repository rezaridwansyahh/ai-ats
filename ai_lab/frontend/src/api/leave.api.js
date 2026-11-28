import api from './axios';

export const getLeaveRequests = (params) => api.get('/leave', { params });
export const createLeaveRequest = (body) => api.post('/leave', body);
export const getLeaveLink = (id) => api.get(`/leave/${id}/link`);
export const resendLeaveLink = (id) => api.post(`/leave/${id}/resend`);
export const getLeaveSaldo = (params) => api.get('/leave/saldo', { params });
export const getLeaveSaldoByNik = (nik, params) => api.get(`/leave/saldo/${encodeURIComponent(nik)}`, { params });
export const setLeaveBalance = (nik, body) => api.put(`/leave/balance/${encodeURIComponent(nik)}`, body);