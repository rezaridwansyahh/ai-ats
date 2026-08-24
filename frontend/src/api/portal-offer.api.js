import portalApi from './portal-axios';

export const getByToken = (token) => portalApi.get(`/portal-offer/${token}`);

export const verifyEmail = (token, email) => portalApi.post(`/portal-offer/${token}/verify-email`, { email });

export const getOffer = (token, offerToken) => portalApi.get(`/portal-offer/${token}/offer`, {  headers: { Authorization: `Bearer ${offerToken}` }, });

export const downloadDocument = (token, offerToken, format) => portalApi.get(`/portal-offer/${token}/document/download${format ? `?format=${format}` : ''}`, { headers: { Authorization: `Bearer ${offerToken}` }, responseType: 'blob', });

export const uploadDocument = (token, offerToken, formData) => portalApi.post(`/portal-offer/${token}/upload`, formData, { headers: { Authorization: `Bearer ${offerToken}`,'Content-Type': 'multipart/form-data', }, });

export const submit = (token, offerToken) => portalApi.post(`/portal-offer/${token}/submit`, null, { headers: { Authorization: `Bearer ${offerToken}` }, });