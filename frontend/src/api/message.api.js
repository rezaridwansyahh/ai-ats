import portalApi from './portal-axios';

export const getMessages = (onboardingToken, conversationId) => portalApi.get(`/chat-bot/message/conversation/${conversationId}`, { headers: { Authorization: `Bearer ${onboardingToken}` }, });

export const sendMessage = (onboardingToken, conversationId, content) => portalApi.post( `/chat-bot/message/conversation/${conversationId}`, { content }, { headers: { Authorization: `Bearer ${onboardingToken}` } });