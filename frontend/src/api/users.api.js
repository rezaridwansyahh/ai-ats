import api from './axios';

export const getUsers    = ()         => api.get('/user');
export const getUserById = (id)       => api.get(`/user/${id}`);
export const createUser  = (data)     => api.post('/user', data);
export const updateUser  = (id, data) => api.put(`/user/${id}`, data);
export const deleteUser  = (id)       => api.delete(`/user/${id}`);
export const getMasterRoles = ()      => api.get('/user/role/all');
