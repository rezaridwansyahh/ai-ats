import portalApi from './portal-axios';

export const getMyAssessmentResults = (onboardingToken) => portalApi.get('/onboarding-assessment-result/results', { headers: { Authorization: `Bearer ${onboardingToken}` }, });

export const getAssessmentResultByBattery = (onboardingToken, battery) => portalApi.get(`/onboarding-assessment-result/results/${battery}`, { headers: { Authorization: `Bearer ${onboardingToken}` }, });

export const submitAssessmentResult = (onboardingToken, data) => portalApi.post('/onboarding-assessment-result/submit', data, { headers: { Authorization: `Bearer ${onboardingToken}` }, });