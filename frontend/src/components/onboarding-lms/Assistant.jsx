import { useState, useRef, useEffect } from 'react';
import {
  Plus, Send, ThumbsUp, ThumbsDown, ExternalLink, FileText, Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LMS_DATA } from './mockData';

/* ---------- small building blocks ---------- */

function ConversationRow({ item, lang, active, onClick }) {
  const title = lang === 'id' ? item.title_id : item.title_en;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
        active ? 'bg-card border shadow-sm' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">{title}</span>
        {item.escalated ? (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 flex-shrink-0 border-amber-300 bg-amber-50 text-amber-700">
            HR
          </Badge>
        ) : item.resolved ? (
          <span className="text-emerald-600 text-xs flex-shrink-0">✓</span>
        ) : null}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {item.when} · {item.turns} turns
      </div>
    </button>
  );
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
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

function ConfidenceBadge({ level, t }) {
  const map = {
    high: { label: t.conf_high, className: 'text-emerald-700' },
    partial: { label: t.conf_partial, className: 'text-amber-700' },
  };
  const c = map[level] || map.high;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${c.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${level === 'high' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
      {c.label}
    </span>
  );
}

function UserBubble({ msg }) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground">You · {msg.when}</span>
        <div className="h-6 w-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
          MP
        </div>
      </div>
      <div className="max-w-lg rounded-2xl bg-emerald-700 text-white px-4 py-2.5 text-sm">
        {msg.text}
      </div>
    </div>
  );
}

function AssistantBubble({ msg, t, feedback, onFeedback, onAskHR }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2 mb-1.5 w-full">
        <div className="h-6 w-6 rounded-md bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-muted-foreground">Assistant · {msg.when}</span>
        {msg.confidence && (
          <span className="ml-auto">
            <ConfidenceBadge level={msg.confidence} t={t} />
          </span>
        )}
      </div>

      <div className="w-full max-w-2xl rounded-xl border bg-card p-5">
        <div className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</div>

        {msg.citations?.length > 0 && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            {msg.citations.map((c, i) => (
              <CitationCard key={i} citation={c} t={t} />
            ))}
          </div>
        )}

        {msg.links?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {msg.links.map((l, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-semibold"
              >
                <ExternalLink className="h-3 w-3" />
                {l.label}
              </span>
            ))}
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
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={onAskHR}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            {t.ask_hr}
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

/* ---------- main component ---------- */

export default function Assistant({ t: outerT, lang }) {
  const { ASSIST_T, ASSIST_HISTORY, ASSIST_CONVERSATION, ASSIST_STARTERS, PHASES } = LMS_DATA;
  const t = { ...outerT, ...ASSIST_T[lang] };
  const activePhase = PHASES.find((p) => p.status === 'active');

  const [activeId, setActiveId] = useState('h1');
  const [messages, setMessages] = useState(ASSIST_CONVERSATION);
  const [input, setInput] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const activeHistoryItem = ASSIST_HISTORY.find((h) => h.id === activeId);
  const title = activeId === null
    ? t.new_conversation
    : activeId === 'h1'
      ? (lang === 'id' ? ASSIST_HISTORY[0].title_id : ASSIST_HISTORY[0].title_en)
      : (lang === 'id' ? activeHistoryItem?.title_id : activeHistoryItem?.title_en);

  const selectConversation = (id) => {
    setActiveId(id);
    setFeedback({});
    if (id === 'h1') {
      setMessages(ASSIST_CONVERSATION);
    } else {
      setMessages([]);
    }
  };

  const startNew = () => {
    setActiveId(null);
    setMessages([]);
    setFeedback({});
  };

  const nowLabel = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const send = (text) => {
    const value = (text ?? input).trim();
    if (!value) return;
    setMessages((prev) => [...prev, { role: 'user', when: nowLabel(), text }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          when: nowLabel(),
          confidence: 'partial',
          text:
            lang === 'id'
              ? 'Ini pratinjau — pencarian langsung belum tersambung, jadi saya belum bisa mengambil kebijakan spesifik untuk pertanyaan ini. Coba lihat percakapan "IT reimbursement steps" untuk contoh jawaban lengkap dengan kutipan, atau tanyakan langsung ke HR.'
              : "This is a preview build — live search isn't wired up yet, so I can't pull a specific policy for this one. Check the \"IT reimbursement steps\" conversation for a full worked example with citations, or ask HR directly.",
          citations: [],
        },
      ]);
    }, 900);
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-7.5rem)]">
      {/* History rail */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        <button
          onClick={startNew}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 hover:bg-emerald-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t.new_conversation}
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-3 mb-1">
            {t.assist_history}
          </div>
          {ASSIST_HISTORY.map((item) => (
            <ConversationRow
              key={item.id}
              item={item}
              lang={lang}
              active={activeId === item.id}
              onClick={() => selectConversation(item.id)}
            />
          ))}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            <Lock className="h-3 w-3" />
            {t.privacy_l}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t.privacy_h}</p>
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 min-w-0 flex flex-col rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0">
          <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
            <Plus className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-base font-bold truncate">{title}</div>
            <div className="text-xs text-muted-foreground">
              {messages.filter((m) => m.role === 'user').length} turns · grounded in policy library + SharePoint
            </div>
          </div>
          {activePhase && (
            <Badge variant="outline" className="text-[10px] px-2 py-1 border-emerald-200 bg-emerald-50 text-emerald-700 flex-shrink-0">
              v3.3 · {t.phase} {activePhase.id}
            </Badge>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && !thinking ? (
            <StarterPrompts starters={ASSIST_STARTERS} lang={lang} t={t} onPick={(q) => send(q)} />
          ) : (
            <>
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <UserBubble key={i} msg={m} />
                ) : (
                  <AssistantBubble
                    key={i}
                    msg={m}
                    t={t}
                    feedback={feedback[i]}
                    onFeedback={(v) => setFeedback((prev) => ({ ...prev, [i]: prev[i] === v ? null : v }))}
                    onAskHR={() => {}}
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

        <div className="border-t px-6 py-4 flex-shrink-0 space-y-2.5">
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
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={() => setAnonymous(!anonymous)}
                className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
                  anonymous ? 'bg-emerald-600' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    anonymous ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-medium">{t.ask_anon}</span>
              <span className="text-xs text-muted-foreground">
                {anonymous ? t.ask_anon_h : 'Your name is attached to this query.'}
              </span>
            </label>
            <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted/40">
              <ExternalLink className="h-3.5 w-3.5" />
              {t.ask_hr}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}