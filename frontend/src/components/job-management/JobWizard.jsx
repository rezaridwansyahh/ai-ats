import { useState, useMemo } from 'react';
import { Globe, Users, CircleDot, Target } from 'lucide-react';

// ── Strategy definitions ──────────────────────────────────────────
// This entire wizard is presentation/state only — no backend endpoint
// exists for "hiring strategy" yet. Selecting a strategy only changes
// local UI state (step list + banner text), it does not persist anywhere.
// TODO: once a strategy field exists on the job record, wire selection
// through to job.api.js (e.g. updateJob(id, { hiring_strategy })).

const STRATEGIES = [
  {
    key: 'external',
    label: 'External',
    caption: 'Posting required',
    icon: Globe,
    title: 'External hiring',
    description: 'Open to public — job boards, referrals, sourcing',
    bullets: [
      'Posting channels visible',
      'Requires JD + salary band',
      'Auto-creates Sourcing campaign',
    ],
    defaultFor: 'most roles',
  },
  {
    key: 'pool-first',
    label: 'Pool-first',
    caption: 'Try pool, post 7d later',
    icon: Users,
    title: 'Pool-first',
    description: 'Mine Talent Pool before opening to public',
    bullets: [
      'Hides Posting step',
      'Shows Pool match preview',
      'Auto-promotes silver medalists',
    ],
    defaultFor: 'roles with rich pool',
  },
  {
    key: 'internal',
    label: 'Internal',
    caption: 'No external channels',
    icon: CircleDot,
    title: 'Internal mobility',
    description: 'Internal employees only — no external posting',
    bullets: [
      'Hides external channels',
      'Manager approval gate',
      'Internal-only JD copy',
    ],
    defaultFor: 'L3+ promotions, lateral moves',
  },
  {
    key: 'campaign',
    label: 'Campaign',
    caption: 'Bulk by city/site',
    icon: Target,
    title: 'Campaign · cohort',
    description: 'Multi-city, multi-headcount cohort hire',
    bullets: [
      'Shows cohort headcount table',
      'Per-city PIC + quotas',
      'Assessment-day scheduler',
    ],
    defaultFor: 'Sales MT, Ops MT, branch hires',
  },
];

// Base step list, in display order. Each strategy filters/annotates this.
const ALL_STEPS = [
  { key: 'basics',        label: 'Requisition basics' },
  { key: 'description',   label: 'Job description' },
  { key: 'cohort',        label: 'Cohort headcount table' },
  { key: 'pipeline',      label: 'Recruitment pipeline' },
  { key: 'posting',       label: 'Posting & channels' },
  { key: 'sweep',         label: 'Pool / internal sweep' },
  { key: 'approval',      label: 'Approval chain' },
];

// Per-strategy config: which steps are skipped, and the note shown per step.
const STRATEGY_STEP_RULES = {
  external: {
    skip: ['cohort', 'sweep'],
    notes: { posting: 'Posting channels visible' },
  },
  'pool-first': {
    skip: ['cohort', 'posting'],
    notes: { sweep: 'Pool match preview shown' },
    skipNotes: { posting: 'Hidden — Pool-first skips public posting' },
  },
  internal: {
    skip: ['cohort', 'posting'],
    notes: { sweep: 'Internal-only sweep' },
    skipNotes: { posting: 'Hidden — Internal hides external channels' },
  },
  campaign: {
    skip: ['sweep'],
    notes: { cohort: 'Campaign mode → bulk by city/site', posting: 'Required at scale' },
    skipNotes: { sweep: 'Pool too thin for cohort scale' },
  },
};

export default function JobWizard() {
  const [strategy, setStrategy] = useState('campaign');

  const rules = STRATEGY_STEP_RULES[strategy];

  const steps = useMemo(() => {
    let n = 0;
    return ALL_STEPS.map(step => {
      const skipped = rules.skip.includes(step.key);
      if (!skipped) n += 1;
      return {
        ...step,
        skipped,
        number: skipped ? null : n,
        note: skipped ? rules.skipNotes?.[step.key] : rules.notes?.[step.key],
      };
    });
  }, [rules]);

  const activeStrategyDef = STRATEGIES.find(s => s.key === strategy);

  return (
    <div className="space-y-6">
      {/* ── Compact strategy picker ───────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategy-driven job creation wizard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a strategy and watch the step list rewrite — skipped steps grey out with a one-line reason.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STRATEGIES.map(s => (
            <button
              key={s.key}
              onClick={() => setStrategy(s.key)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                strategy === s.key
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card hover:bg-muted/30'
              }`}
            >
              <div className="text-sm font-semibold">{s.label}</div>
              <div className={`text-xs mt-0.5 ${strategy === s.key ? 'text-background/70' : 'text-muted-foreground'}`}>
                {s.caption}
              </div>
            </button>
          ))}
        </div>

        {/* Step list */}
        <div className="rounded-2xl border p-2 space-y-1.5">
          {steps.map(step => (
            <div
              key={step.key}
              className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${
                step.skipped ? 'bg-muted/20' : 'bg-emerald-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-semibold ${
                    step.skipped
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-emerald-800 text-white'
                  }`}
                >
                  {step.number ?? '—'}
                </span>
                <span className={step.skipped ? 'text-muted-foreground line-through' : 'text-emerald-900 font-medium text-sm'}>
                  {step.label}
                </span>
              </div>
              {step.note && (
                <span className="text-xs italic text-muted-foreground">{step.note}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed strategy cards ───────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">How will you hire for this role?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pick the hiring strategy first — it reshapes the downstream wizard. Pool-first hides Posting; Internal hides external channels; Campaign reveals the cohort headcount table.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRATEGIES.map(s => {
            const Icon = s.icon;
            const selected = strategy === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStrategy(s.key)}
                className={`text-left rounded-2xl border p-5 transition-colors ${
                  selected ? 'border-2 border-foreground' : 'border hover:bg-muted/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`flex items-center justify-center h-9 w-9 rounded-lg ${
                    selected ? 'bg-foreground text-background' : 'bg-muted'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-sm">{s.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                <div className="border-t pt-3 space-y-1.5">
                  {s.bullets.map(b => (
                    <div key={b} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>→</span> {b}
                    </div>
                  ))}
                </div>
                <p className="text-xs italic text-muted-foreground mt-3">
                  Default for: {s.defaultFor}
                </p>
              </button>
            );
          })}
        </div>

        {/* Confirmation banner */}
        <div className="rounded-xl border bg-blue-50 text-blue-900 px-4 py-3 text-sm flex items-center justify-between">
          <span>
            Strategy <strong>{activeStrategyDef.label}</strong> applied — wizard step list updates accordingly.
          </span>
        </div>
      </div>
    </div>
  );
}