import api from './axios';

export const searchSourcing = (data) => api.post('/sourcing/search', data);
export const getSourcing = (id) => api.get(`/sourcing/${id}`);
export const getAllSourcings = () => api.get('/sourcing');
export const deleteSourcing = (id) => api.delete(`/sourcing/${id}`);
