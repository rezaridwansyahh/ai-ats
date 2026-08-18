import api from './axios';

export const getTemplateStages = () => api.get('/template-stage');
export const getTemplateStageById = (id) => api.get(`/template-stage/${id}`);

export const createTemplateStage = (payload) => api.post('/template-stage', payload);
export const updateTemplateStage = (id, payload) => api.put(`/template-stage/${id}`, payload);
export const deleteTemplateStage = (id) => api.delete(`/template-stage/${id}`);

export const addTemplateStageStage = (templateId, payload) =>
  api.post(`/template-stage/${templateId}/stages`, payload);
export const updateTemplateStageStage = (stageId, payload) =>
  api.put(`/template-stage/stages/${stageId}`, payload);
export const deleteTemplateStageStage = (stageId) =>
  api.delete(`/template-stage/stages/${stageId}`);
