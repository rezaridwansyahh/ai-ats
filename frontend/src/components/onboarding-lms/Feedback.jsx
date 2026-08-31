import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function RatingRow({label, hint, value, onChange}){
  return(
    <div className="py-4 border-b last:border-b-0">
      <div className="text-sm font-medium mb-0.5">{label}</div>
      <div className="text-xs text-muted-foreground mb-3">{hint}</div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
              value === n ? 'bg-emerald-700 text-white border-emerald-700' : 'hover:bg-muted/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Feedback({ moduleId, t, lang, goTo }){
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if(submitted){
    return (
      <div className="max-w-xl mx-auto pb-12 text-center pt-12">
        <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-emerald-700" />
        </div>
        <h1 className="font-serif text-xl font-bold mb-2">{t.thanks_feedback ?? 'Thanks — noted.'}</h1>
        <Button className="mt-4" onClick={() => goTo('journey')}>{t.back_journey}</Button>
      </div>
    );
  }

  return(
    <div className="max-w-xl mx-auto pb-12">
      <button
        onClick={() => goTo('module', { moduleId })}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t.back_journey}
      </button>

      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
        {t.fb_eyebrow}
      </div>
      <h1 className="font-serif text-2xl font-bold mb-1">{t.fb_title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t.fb_sub}</p>

      <div className="rounded-xl border bg-card px-6 mb-4">
        <RatingRow label={t.fb_q1} hint={t.fb_q1_h} value={q1} onChange={setQ1} />
        <RatingRow label={t.fb_q2} hint={t.fb_q2_h} value={q2} onChange={setQ2} />
        <RatingRow label={t.fb_q3} hint={t.fb_q3_h} value={q3} onChange={setQ3} />
      </div>

      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="text-sm font-medium mb-0.5">{t.fb_q4}</div>
        <div className="text-xs text-muted-foreground mb-3">{t.fb_q4_h}</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.fb_placeholder}
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => goTo('journey')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t.fb_skip}
        </button>
        <Button onClick={() => setSubmitted(true)}>{t.fb_submit}</Button>
      </div>
    </div>
  );
}