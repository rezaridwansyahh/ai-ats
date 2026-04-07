import api from './axios';

export const getTemplateStages = () => api.get('/template-stage');
export const getTemplateStageById = (id) => api.get(`/template-stage/${id}`);
