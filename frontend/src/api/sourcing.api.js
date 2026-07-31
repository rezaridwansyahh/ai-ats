import api from './axios';

export const searchSourcing = (data) => api.post('/sourcing/search', data);
export const getSourcing = (id) => api.get(`/sourcing/${id}`);
export const getAllSourcings = () => api.get('/sourcing');
export const deleteSourcing = (id) => api.delete(`/sourcing/${id}`);

export const uploadCv = (formData) =>
  api.post('/sourcing/upload-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getUploadHistory = (limit = 50) =>
  api.get(`/sourcing/upload-history?limit=${limit}`);
