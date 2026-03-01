import api from './axios'; 

export const getModules = () => api.get('/module');
export const getModuleById = (id) => api.get(`/module/${id}`);
export const getModulesByMenu = (menu_id) => api.get(`/module/menu/${menu_id}`);
export const createModule = (data) => api.post('/module', data);
export const updateModule = (id, data) => api.put(`/module/${id}`, data);
export const deleteModule = (id) => api.delete(`/module/${id}`);