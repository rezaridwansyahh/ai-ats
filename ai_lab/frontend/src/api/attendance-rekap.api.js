import api from './axios';

export const getAttendanceRekap = (params) => api.get('/attendance-rekap', { params });
export const getAttendanceRekapDetail = (nik, params) => api.get(`/attendance-rekap/${encodeURIComponent(nik)}`, { params });
export const exportAttendanceRekap = (params) => api.get('/attendance-rekap/export', { params, responseType: 'blob' });