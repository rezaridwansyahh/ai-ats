import api from './axios';

export const getJobPipeline = (jobId) => api.get(`/pipeline/${jobId}`);

export const saveJobPipeline = (jobId, { stages, templateId }) =>
  api.put(`/pipeline/${jobId}`, { stages, templateId });
