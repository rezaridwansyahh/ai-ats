import OpenAI from 'openai';
import MessageModel from './message.model.js';
import ConversationService from '../conversation/conversation.service.js';
import WeaviateService from '../../../shared/services/weavite.service.js';

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_LIMIT = 10;
const CONTEXT_LIMIT = 3;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class MessageService {
  async listByConversation(conversation_id, onboarding_id) {
    await ConversationService.assertOwnership(conversation_id, onboarding_id);
    return MessageModel.findByConversationId(conversation_id);
  }

  async respondToMessage(conversation_id, onboarding_id, content) {
    const conversation = await ConversationService.assertOwnership(conversation_id, onboarding_id);

    const trimmed = (content || '').trim();
    if (!trimmed) throw { status: 400, message: 'Message cannot be empty.' };
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw { status: 400, message: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` };
    }

    const userMessage = await MessageModel.create({ conversation_id, role: 'user', content: trimmed });

    const context = await WeaviateService.queryContext({
      companyId: conversation.company_id,
      query: trimmed,
      limit: CONTEXT_LIMIT,
    });

    const history = await MessageModel.findByConversationId(conversation_id);
    const recentHistory = history.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }));

    const contextText = context.length > 0
      ? context.map((c) => `Source: ${c.source}\n${c.content}`).join('\n---\n')
      : 'No relevant company documents were found for this question.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful onboarding assistant. Answer the employee's question using ONLY the company documents provided below. If the documents don't contain the answer, say you don't have that information and suggest they contact HR. Be concise and friendly.\n\nCompany documents:\n${contextText}`,
        },
        ...recentHistory,
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const replyText = completion.choices[0].message.content;

    const assistantMessage = await MessageModel.create({
      conversation_id,
      role: 'assistant',
      content: replyText,
      retrieved_context: context.length > 0 ? JSON.stringify(context) : null,
    });

    return { userMessage, assistantMessage };
  }
}

export default new MessageService();