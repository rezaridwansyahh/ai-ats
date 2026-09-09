import MessageService from './message.service.js';

class MessageController {
  async list(req, res) {
    try {
      const { conversation_id } = req.params;
      const messages = await MessageService.listByConversation(conversation_id, req.onboardingId);
      res.status(200).json({ message: 'Messages fetched', messages });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { conversation_id } = req.params;
      const { content } = req.body || {};
      const userMessage = await MessageService.saveUserMessage(conversation_id, req.onboardingId, content);
      res.status(201).json({ message: 'Message sent', userMessage });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new MessageController();