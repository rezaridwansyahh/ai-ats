import { useState, useRef, useEffect } from 'react';
import { Plus, Send, ThumbsUp, ThumbsDown, ExternalLink, FileText, Lock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LMS_DATA } from './mockData';
import { getOnboardingToken } from '@/lib/onboardingPortalAuth';
import { getConversation } from '@/api/conversation.api';
import { getMessages, sendMessage } from '@/api/message.api';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function CitationCard({ citation, t }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3.5 py-2.5">
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{t.cite_l}</div>
        <div className="text-sm font-semibold truncate">{citation.name}</div>
        <div className="text-xs text-muted-foreground truncate">{citation.sub}</div>
      </div>
    </div>
  );
}

function UserBubble({ msg }) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground">You · {formatTime(msg.created_at)}</span>
      </div>
      <div className="max-w-lg rounded-2xl bg-emerald-700 text-white px-4 py-2.5 text-sm">
        {msg.content}
      </div>
    </div>
  );
}

function AssistantBubble({ msg, t, feedback, onFeedback }) {
  const citations = (() => {
    try {
      const ctx = msg.retrieved_context ? JSON.parse(msg.retrieved_context) : [];
      return ctx.map((c) => ({ name: c.source, sub: c.content?.slice(0, 80) + '...' }));
    } catch {
      return [];
    }
  })();

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2 mb-1.5 w-full">
        <div className="h-6 w-6 rounded-md bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-muted-foreground">Assistant · {formatTime(msg.created_at)}</span>
      </div>

      <div className="w-full max-w-2xl rounded-xl border bg-card p-5">
        <div className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</div>

        {citations.length > 0 && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            {citations.map((c, i) => <CitationCard key={i} citation={c} t={t} />)}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
          <button
            onClick={() => onFeedback('up')}
            className={`transition-colors ${feedback === 'up' ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onFeedback('down')}
            className={`transition-colors ${feedback === 'down' ? 'text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StarterPrompts({ starters, lang, t, onPick }) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="h-12 w-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center mx-auto mb-4">
        <Plus className="h-6 w-6" />
      </div>
      <h2 className="font-serif text-xl font-bold mb-1">{t.assist_title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t.assist_sub}</p>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 text-left">
        {t.starter_prompts_l}
      </div>
      <div className="space-y-1.5 text-left">
        {starters.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(lang === 'id' ? s.q_id : s.q_en)}
            className="w-full text-left px-4 py-2.5 rounded-lg border bg-card text-sm hover:bg-muted/40 transition-colors"
          >
            {lang === 'id' ? s.q_id : s.q_en}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Assistant({ t: outerT, lang }) {
  const { ASSIST_T, ASSIST_STARTERS, PHASES } = LMS_DATA;
  const t = { ...outerT, ...ASSIST_T[lang] };
  const activePhase = PHASES.find((p) => p.status === 'active');

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    const init = async () => {
      const token = getOnboardingToken();
      if (!token) { setLoadingHistory(false); return; }
      try {
        const convRes = await getConversation(token);
        const conv = convRes.data.conversation;
        setConversationId(conv.id);
        const msgRes = await getMessages(token, conv.id);
        setMessages(msgRes.data.messages || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load conversation');
      } finally {
        setLoadingHistory(false);
      }
    };
    init();
  }, []);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || !conversationId) return;

    const token = getOnboardingToken();
    setInput('');
    setError(null);
    setThinking(true);
    setMessages((prev) => [...prev, { role: 'user', content: value, created_at: new Date().toISOString() }]);

    try {
      const res = await sendMessage(token, conversationId, value);
      setMessages((prev) => [...prev, res.data.assistantMessage]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setThinking(false);
    }
  };

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-xl border bg-card overflow-hidden h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0">
        <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
          <Plus className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base font-bold truncate">{t.assist_title}</div>
          <div className="text-xs text-muted-foreground">
            {messages.filter((m) => m.role === 'user').length} turns · grounded in your company's documents
          </div>
        </div>
        {activePhase && (
          <Badge variant="outline" className="text-[10px] px-2 py-1 border-emerald-200 bg-emerald-50 text-emerald-700 flex-shrink-0">
            {t.phase} {activePhase.id}
          </Badge>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {messages.length === 0 && !thinking ? (
          <StarterPrompts starters={ASSIST_STARTERS} lang={lang} t={t} onPick={(q) => send(q)} />
        ) : (
          <>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <UserBubble key={m.id ?? i} msg={m} />
              ) : (
                <AssistantBubble
                  key={m.id ?? i}
                  msg={m}
                  t={t}
                  feedback={feedback[i]}
                  onFeedback={(v) => setFeedback((prev) => ({ ...prev, [i]: prev[i] === v ? null : v }))}
                />
              )
            )}
            {thinking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-6 w-6 rounded-md bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                {t.thinking}…
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t.ask_placeholder}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => send()}
            className="h-10 w-10 flex-shrink-0 rounded-lg bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 transition-colors disabled:opacity-40"
            disabled={!input.trim() || thinking}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}