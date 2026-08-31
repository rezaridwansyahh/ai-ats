import portalApi from './portal-axios';

export const login = (email) => portalApi.post('/portal-onboarding/login', { email });

export const getMe = (onboardingToken) => portalApi.get('/portal-onboarding/me', { headers: { Authorization: `Bearer ${onboardingToken}` }, });

export const getCurriculum = (onboardingToken) => portalApi.get('/portal-onboarding/curriculum', { headers: { Authorization: `Bearer ${onboardingToken}` },});