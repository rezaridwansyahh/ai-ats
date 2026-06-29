import portalApi from './portal-axios';

export const getBgConsentByToken = (token) => portalApi.get(`/portal-bg-consent/${token}`);

export const signBgConsent = (token) => portalApi.post(`/portal-bg-consent/${token}/sign`);