import { CheckCircle2, Circle, Lock, Clock, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { LMS_DATA } from './mockData';

const MILESTONE_ORDER = ['pre', 'd7', 'd30', 'd60'];

const STATUS_STYLE = {
  done:            { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  available:       { icon: Circle,       className: 'bg-blue-50 text-blue-700 border-blue-200' },
  upcoming:        { icon: Clock,        className: 'bg-amber-50 text-amber-700 border-amber-200' },
  locked:          { icon: Lock,         className: 'bg-muted text-muted-foreground border-transparent' },
  'leadership-only': { icon: Lock,       className: 'bg-muted text-muted-foreground border-transparent' },
};

function StatusPill({ status, at }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.locked;
  const Icon = s.icon;
  const labelKey = {
    done: 'asx_status_done',
    available: 'asx_status_now',
    upcoming: 'asx_status_upcoming',
    locked: 'asx_status_locked',
    'leadership-only': 'asx_status_optional',
  }[status] || 'asx_status_locked';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${s.className}`}>
      <Icon className="h-3 w-3" />
      {at[labelKey]}
    </span>
  );
}

function PrincipleCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Icon className="h-4 w-4 text-emerald-700 mb-2" />
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
    </div>
  );
}

function AssessmentCard({ a, lang, at, onOpen }) {
  const title = lang === 'id' ? a.title_id : a.title_en;
  const tagline = lang === 'id' ? a.tagline_id : a.tagline_en;
  const itemsLabel = lang === 'id' ? a.itemsLabel_id : a.itemsLabel_en;
  const isDone = a.status === 'done';
  const isLocked = a.status === 'locked' || a.status === 'leadership-only';

  const ctaLabel = isDone ? at.asx_view_result : (a.status === 'available' ? at.asx_start : at.asx_resume);

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => !isLocked && onOpen(a.id)}
      className={[
        'text-left rounded-xl border bg-card p-4 transition-colors w-full',
        isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="font-serif text-lg text-emerald-700">{a.seq}</span>
        <StatusPill status={a.status} at={at} />
      </div>
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{tagline}</div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
        <span>{a.items} {itemsLabel}</span>
        <span>·</span>
        <span>{a.minutes} {at.asx_minutes}</span>
      </div>
      {!isLocked && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
          {ctaLabel} →
        </span>
      )}
      {a.status === 'leadership-only' && (
        <div className="text-[11px] text-muted-foreground mt-1">
          {lang === 'id' ? a.lockedReason_id : a.lockedReason_en}
        </div>
      )}
    </button>
  );
}

export default function Assessments({ lang, goTo }) {
  const { ASSESS_T, ASSESSMENTS } = LMS_DATA;
  const at = ASSESS_T[lang];

  const doneCount = ASSESSMENTS.filter((a) => a.status === 'done').length;
  const minutesSpent = ASSESSMENTS.filter((a) => a.status === 'done').reduce((s, a) => s + a.minutes, 0);

  const grouped = MILESTONE_ORDER.map((key) => ({
    key,
    items: ASSESSMENTS.filter((a) => a.milestone === key),
  })).filter((g) => g.items.length > 0);

  const milestoneLabel = {
    pre: at.asx_milestone_pre,
    d7: at.asx_milestone_d7,
    d30: at.asx_milestone_d30,
    d60: at.asx_milestone_d60,
  };
  const milestoneSubLabel = {
    pre: at.asx_milestone_pre_l,
    d7: at.asx_milestone_d7_l,
    d30: at.asx_milestone_d30_l,
    d60: at.asx_milestone_d60_l,
  };

  const onOpen = (assessmentId) => goTo('assessment', { assessmentId });

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase mb-2">
        {at.asx_eyebrow}
      </div>
      <h1 className="font-serif text-3xl mb-2">
        {at.asx_title}<em className="not-italic text-emerald-700">{at.asx_title_em}</em>
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl mb-6">{at.asx_sub}</p>

      {/* Progress overview */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-3">
          {at.asx_progress_l}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="font-serif text-2xl font-bold">{doneCount}/{ASSESSMENTS.length}</div>
            <div className="text-[11px] text-muted-foreground">{at.asx_milestones}</div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold">
              {ASSESSMENTS.reduce((s, a) => s + a.items, 0)}
            </div>
            <div className="text-[11px] text-muted-foreground">{at.asx_total_items}</div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold">{minutesSpent}</div>
            <div className="text-[11px] text-muted-foreground">{at.asx_minutes_spent}</div>
          </div>
        </div>
      </div>

      {/* Principles */}
      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-3">
        {at.asx_principle_l}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <PrincipleCard icon={ShieldCheck} title={at.asx_p1_t} body={at.asx_p1_b} />
        <PrincipleCard icon={Sparkles}    title={at.asx_p2_t} body={at.asx_p2_b} />
        <PrincipleCard icon={Eye}         title={at.asx_p3_t} body={at.asx_p3_b} />
        <PrincipleCard icon={Lock}        title={at.asx_p4_t} body={at.asx_p4_b} />
      </div>

      {/* Milestone groups */}
      <div className="space-y-8">
        {grouped.map((g) => (
          <div key={g.key}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-serif text-base font-semibold">{milestoneLabel[g.key]}</span>
              <span className="text-xs text-muted-foreground">— {milestoneSubLabel[g.key]}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {g.items.map((a) => (
                <AssessmentCard key={a.id} a={a} lang={lang} at={at} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}