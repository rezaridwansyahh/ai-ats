import { useState, useRef, useEffect } from 'react';
import {
  Plus, Send, ThumbsUp, ThumbsDown, ExternalLink, FileText, Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LMS_DATA } from './mockData';

function ConversatioRow({ item, lang, active, onClick }){
  const title = lang === 'id' ? item.title_id : item.title_en;
  return(
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

function CitationCard({ citation, t }){
  return(
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