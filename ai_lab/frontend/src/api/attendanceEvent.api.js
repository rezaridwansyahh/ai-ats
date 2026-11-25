import api from './axios';

export const getAttendanceClock = (nik) => api.get(`/attendance-event/clock/${encodeURIComponent(nik)}`);
export const sendAttendanceEvent = (data) => api.post('/attendance-event/events/', data);