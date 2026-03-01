import api from './axios';

export const getRoles           = () => api.get('/role');
export const getRoleById        = (id) => api.get(`/role/${id}`);
export const createRole         = (data)  => api.post('/role', data);
export const updateRole         = (id, data)   => api.put(`/role/${id}`, data);
export const deleteRole         = (id)  => api.delete(`/role/${id}`);
export const setRolePermissions = (id, permission_ids)  => api.put(`/role/${id}/permission`, { permission_ids });

export const getRolePermissions = (id)  => api.get(`/permission/role/${id}`);
export const getAllPermissions   = ()   => api.get('/permission/details');
