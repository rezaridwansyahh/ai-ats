import MessageModel from './message.model.js';
import ConversationService from '../conversation/conversation.service.js';

const MAX_MESSAGE_LENGTH = 500;

class MessageService {
  async listByConversation(conversation_id, onboarding_id) {
    await ConversationService.assertOwnership(conversation_id, onboarding_id);
    return MessageModel.findByConversationId(conversation_id);
  }

  async saveUserMessage(conversation_id, onboarding_id, content) {
    await ConversationService.assertOwnership(conversation_id, onboarding_id);

    const trimmed = (content || '').trim();
    if (!trimmed) {
      throw { status: 400, message: 'Message cannot be empty.' };
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw { status: 400, message: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` };
    }

    return MessageModel.create({ conversation_id, role: 'user', content: trimmed });
  }

  // Called by the future chat-bot orchestrator once context retrieval + LLM call exist
  async saveAssistantMessage(conversation_id, content, retrieved_context = null) {
    return MessageModel.create({ conversation_id, role: 'assistant', content, retrieved_context });
  }
}

export default new MessageService();