import api from './axios';

export const getSetting = (key) => api.get(`/setting/${key}`);
export const saveSetting = (key, value) => api.put(`/setting/${key}`, { value });
