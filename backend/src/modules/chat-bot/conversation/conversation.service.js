import ConversationModel from './conversation.model.js';
import PortalOnboardingModel from '../../portal-onboarding/portal-onboarding.model.js';

class ConversationService {
  async getOrCreateForOnboarding(onboarding_id) {
    const onboarding = await PortalOnboardingModel.getById(onboarding_id);
    if (!onboarding) throw { status: 404, message: 'Onboarding record not found.' };

    const existing = await ConversationModel.findActiveByOnboardingId(onboarding_id);
    if (existing) return existing;

    return ConversationModel.create({
      candidate_onboarding_id: onboarding_id,
      company_id: onboarding.company_id,
    });
  }

  async assertOwnership(conversation_id, onboarding_id) {
    const conversation = await ConversationModel.getById(conversation_id);
    if (!conversation) throw { status: 404, message: 'Conversation not found.' };
    if (conversation.candidate_onboarding_id !== Number(onboarding_id)) {
      throw { status: 403, message: 'Access denied.' };
    }
    return conversation;
  }
}

export default new ConversationService();