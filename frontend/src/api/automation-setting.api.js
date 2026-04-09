import api from './axios';

export const getAutomationSetting = (jobId) => api.get(`/automation-setting/${jobId}`);
export const createAutomationSetting = (data) => api.post(`/automation-setting`, data);
