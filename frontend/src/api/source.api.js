import api from './axios';

export const uploadSource = (file) => { const formData = new FormData(); formData.append('file', file); return api.post('/chat-bot/source', formData, { headers: { 'Content-Type': 'multipart/form-data' }, });};

export const listSources = () => api.get('/chat-bot/source');

export const deleteSource = (id) => api.delete(`/chat-bot/source/${id}`);