import portalApi, { PORTAL_TOKEN_KEY } from './portal-axios';

const BG_CONSENT_TOKEN_KEY = 'bg_consent_token';

export const getBgConsentSummary = (token) => portalApi.get(`/portal-bg-consent/${token}`);

export const verifyBgConsentEmail = async (token, email) => {
  const res = await portalApi.post(`/portal-bg-consent/${token}/verify-email`, { email });
  const bgConsentToken = res.data?.bg_consent_token;
  if (bgConsentToken) localStorage.setItem(BG_CONSENT_TOKEN_KEY, bgConsentToken);
  return res;
};

export const getBgConsent = (token) => portalApi.get(`/portal-bg-consent/${token}/consent`, { headers: { Authorization: `Bearer ${localStorage.getItem(BG_CONSENT_TOKEN_KEY)}` }, });

export const signBgConsent = (token) => portalApi.post(`/portal-bg-consent/${token}/sign`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem(BG_CONSENT_TOKEN_KEY)}` }, });