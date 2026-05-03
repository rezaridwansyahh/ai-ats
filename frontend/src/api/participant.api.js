import api from './axios';

export const getParticipants = () => api.get('/participant');
export const getParticipantById = (id) => api.get(`/participant/${id}`);
export const getParticipantByEmail = (email) => api.get(`/participant/email/${email}`);
export const createParticipant = (data) => api.post('/participant', data);
export const createParticipantByEmail = (data) => api.post('/participant/create-by-email', data);
export const updateParticipant = (id, data) => api.put(`/participant/${id}`, data);
export const deleteParticipant = (id)=> api.delete(`/participant/${id}`);
