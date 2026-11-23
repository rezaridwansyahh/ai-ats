import api from './axios';

export const getNavigation = () => api.get('/module/navigation');
export const getModules = () => api.get('/module');
export const getModuleById = (id) => api.get(`/module/${id}`);
export const getModulesByMenuId = (menuId) => api.get(`/module/menu/${menuId}`);
export const createModule = (name) => api.post('/module', { name });
export const updateModule = (id, name) => api.put(`/module/${id}`, { name });
export const deleteModule = (id) => api.delete(`/module/${id}`);