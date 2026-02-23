import api from './axios';

export const getRoles           = ()                        => api.get('/roles');
export const getRoleById        = (id)                      => api.get(`/roles/${id}`);
export const createRole         = (data)                    => api.post('/roles', data);
export const updateRole         = (id, data)                => api.put(`/roles/${id}`, data);
export const deleteRole         = (id)                      => api.delete(`/roles/${id}`);
export const setRolePermissions = (id, permission_ids)      => api.put(`/roles/${id}/permissions`, { permission_ids });

export const getRolePermissions = (id)                      => api.get(`/permissions/role/${id}`);
export const getAllPermissions   = ()                        => api.get('/permissions/details');
