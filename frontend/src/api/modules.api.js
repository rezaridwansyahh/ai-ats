import api from './axios'; 

export const getModules = () => api.get('/modules');
export const getModuleById = (id) => api.get(`/modules/${id}`);
export const getModulesByMenu = (menu_id) => api.get(`/modules/menu/${menu_id}`);
export const createModule = (data) => api.post('/modules', data);
export const updateModule = (id, data) => api.put(`/modules/${id}`, data);
export const deleteModule = (id) => api.delete(`/modules/${id}`);