import { ChevronLeft, AlertTriangle, Lock } from 'lucide-react';
import { LMS_DATA } from './mockData';

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-2">{title}</div>
      <div className="text-sm leading-relaxed whitespace-pre-line">{children}</div>
    </div>
  );
}

function ResultBars({ bars, lang }) {
  const max = Math.max(...bars.map((b) => b.v));
  return (
    <div className="space-y-2.5">
      {bars.map((b) => {
        const label = lang === 'id' ? b.k_id : b.k_en;
        const pct = Math.round((b.v / max) * 100);
        return (
          <div key={label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground font-mono">{b.v}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AssessmentDetail({ assessmentId, lang, goTo }) {
  const { ASSESS_T, ASSESSMENTS } = LMS_DATA;
  const at = ASSESS_T[lang];
  const a = ASSESSMENTS.find((x) => x.id === assessmentId);

  if (!a) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 text-muted-foreground text-sm">
        Assessment not found.
      </div>
    );
  }

  const title = lang === 'id' ? a.title_id : a.title_en;
  const tagline = lang === 'id' ? a.tagline_id : a.tagline_en;
  const itemsLabel = lang === 'id' ? a.itemsLabel_id : a.itemsLabel_en;
  const outputsLabel = lang === 'id' ? a.outputsLabel_id : a.outputsLabel_en;
  const isDone = a.status === 'done';
  const isLocked = a.status === 'locked' || a.status === 'leadership-only';

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <button
        onClick={() => goTo('assessments')}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {at.asx_back_list}
      </button>

      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-2">
        {at.asx_ref}: {a.ref}
      </div>
      <h1 className="font-serif text-2xl mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{tagline}</p>

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 mb-6">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>{lang === 'id' ? a.lockedReason_id : a.lockedReason_en}</span>
        </div>
      )}

      <div className="rounded-xl border bg-card px-5 mb-6">
        <InfoRow label={at.asx_milestone_l} value={a.milestoneDay} />
        <InfoRow label={at.asx_items} value={`${a.items} ${itemsLabel}`} />
        <InfoRow label={at.asx_minutes_spent} value={`${a.minutes} ${at.asx_minutes}`} />
        <InfoRow label={at.asx_outputs} value={`${a.outputs} ${outputsLabel}`} />
        <InfoRow label={at.asx_share_l} value={at.asx_share_v} />
      </div>

      {isDone && a.result && (
        <div className="rounded-xl border bg-card p-5 mb-6">
          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-3">
            {at.asx_top_results}
          </div>
          <div className="mb-4">
            <div className="text-lg font-serif font-bold">
              {lang === 'id' ? a.result.primary_id : a.result.primary_en}
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === 'id' ? a.result.secondary_id : a.result.secondary_en}
            </div>
          </div>
          <ResultBars bars={a.result.bars} lang={lang} />
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            {lang === 'id' ? a.result.summary_id : a.result.summary_en}
          </p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <Section title={at.asx_what}>{lang === 'id' ? a.what_id : a.what_en}</Section>
        <Section title={at.asx_why}>{lang === 'id' ? a.why_id : a.why_en}</Section>
        <Section title={at.asx_youget}>{lang === 'id' ? a.youget_id : a.youget_en}</Section>
        <Section title={at.asx_hrdoes}>{lang === 'id' ? a.hrdoes_id : a.hrdoes_en}</Section>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-xs leading-relaxed mb-6 flex items-start gap-2 ${
        a.caveatStrong ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-border bg-muted/30 text-muted-foreground'
      }`}>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-0.5">{at.asx_caveat}</div>
          <div>{lang === 'id' ? a.caveat_id : a.caveat_en}</div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 mb-6">
        {at.asx_dev_only}
      </div>

      {!isLocked && !isDone && (
        <button
          className="w-full rounded-lg bg-emerald-700 text-white text-sm font-semibold py-3"
          onClick={() => { /* not wired to a backend flow yet — placeholder for the actual test-taking screen */ }}
        >
          {at.asx_take_now}
        </button>
      )}
    </div>
  );
}