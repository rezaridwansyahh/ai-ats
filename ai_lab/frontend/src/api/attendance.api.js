import api from './axios';

export const getAttendanceHome = (params) => api.get('/attendance/home', { params });
export const getAttendanceDashboard = (params) => api.get('/attendance/dashboard', { params });
export const getAttendanceRecap = (params) => api.get('/attendance/recap', { params });