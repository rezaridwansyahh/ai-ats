import api from './axios';

export const getJobPipeline = (jobId) => api.get(`/pipeline/${jobId}`);

export const saveJobPipeline = (jobId, stages) => api.put(`/pipeline/${jobId}`, { stages });
