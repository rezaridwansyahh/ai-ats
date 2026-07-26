import api from './axios';

export const getByToken = (token) => api.get(`/portal-offer/${token}`);

export const verifyEmail = (token, email) => api.post(`/portal-offer/${token}/verify-email`, { email });

export const getOffer = (token, offerToken) => api.get(`/portal-offer/${token}/offer`, { headers: { Authorization: `Bearer ${offerToken}` },});

export const sign = (token, offerToken) => api.post(`/portal-offer/${token}/sign`, null, { headers: { Authorization: `Bearer ${offerToken}` }, });