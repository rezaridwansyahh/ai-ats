import api from './axios';

export const getByToken = (token) => api.get(`/portal-offer/${token}`);

export const verifyEmail = (token, email) => api.post(`/portal-offer/${token}/verify-email`, { email });

export const getOffer = (token, offerToken) => api.get(`/portal-offer/${token}/offer`, { headers: { Authorization: `Bearer ${offerToken}` }, });

export const downloadDocument = (token, offerToken, format) => api.get(`/portal-offer/${token}/document/download${format ? `?format=${format}` : ''}`, { headers: { Authorization: `Bearer ${offerToken}` },  responseType: 'blob', });

export const uploadDocument = (token, offerToken, formData) => api.post(`/portal-offer/${token}/upload`, formData, { headers: {  Authorization: `Bearer ${offerToken}`,  'Content-Type': 'multipart/form-data',  }, });

export const submit = (token, offerToken) => api.post(`/portal-offer/${token}/submit`, null, { headers: { Authorization: `Bearer ${offerToken}` }, });