import ConversationService from './conversation.service.js';

class ConversationController {
  async getMe(req, res) {
    try {
      const conversation = await ConversationService.getOrCreateForOnboarding(req.onboardingId);
      res.status(200).json({ message: 'Conversation fetched', conversation });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ConversationController();