import portalApi from './portal-axios';

export const getConversation = (onboardingToken) => portalApi.get('/chat-bot/conversation/me', { headers: { Authorization: `Bearer ${onboardingToken}` }, });