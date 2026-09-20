export const ONBOARDING_TOKEN_KEY = 'onboarding_portal_token';

export function getOnboardingToken() {
  return localStorage.getItem(ONBOARDING_TOKEN_KEY);
}

export function setOnboardingToken(token) {
  localStorage.setItem(ONBOARDING_TOKEN_KEY, token);
}

export function clearOnboardingToken() {
  localStorage.removeItem(ONBOARDING_TOKEN_KEY);
}