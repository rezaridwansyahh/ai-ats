import api from './axios';

export const getLeavePortal = (token) => api.get(`/portal-leave/${token}`);
export const decideLeavePortal = (token, body) => api.post(`/portal-leave/${token}/decide`, body);