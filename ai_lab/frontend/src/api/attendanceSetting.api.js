import api from './axios';

export const getAttendanceSettings = () => api.get('/attendance-setting');
export const updateAttendanceSettings = (data) => api.put('/attendance-setting', data);