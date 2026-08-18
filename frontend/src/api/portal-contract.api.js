import portalApi from './portal-axios';

export const getByToken = (token) => portalApi.get(`/portal-contract/${token}`);

export const verifyEmail = (token, email) => portalApi.post(`/portal-contract/${token}/verify-email`, { email });

export const getContract = (token, contractToken) => portalApi.get(`/portal-contract/${token}/contract`, { headers: { Authorization: `Bearer ${contractToken}` }, });

export const downloadDocument = (token, contractToken, format) => portalApi.get(`/portal-contract/${token}/document/download${format ? `?format=${format}` : ''}`, { headers: { Authorization: `Bearer ${contractToken}` }, responseType: 'blob', });

export const uploadDocument = (token, contractToken, formData) => portalApi.post(`/portal-contract/${token}/upload`, formData, { headers: { Authorization: `Bearer ${contractToken}`, 'Content-Type': 'multipart/form-data', }, });

export const submit = (token, contractToken) => portalApi.post(`/portal-contract/${token}/submit`, null, { headers: { Authorization: `Bearer ${contractToken}` }, });