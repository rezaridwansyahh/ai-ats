import { Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepCard, StatusPill } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Tone map for check-in status
───────────────────────────────────────────────────────────────────────────── */

const CHECKIN_TONE = {
  onTrack: { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'On track' },
  atRisk:  { pill: 'border-amber-200  bg-amber-50  text-amber-700',    dot: 'bg-amber-500',   label: 'At-risk'  },
  awaiting:{ pill: 'border-border     bg-muted/40  text-muted-foreground', dot: 'bg-muted-foreground/40', label: 'Awaiting' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components used only within Probation
───────────────────────────────────────────────────────────────────────────── */

function CheckInRow({ checkin }) {
  const isAwaiting = checkin.status === 'awaiting';
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-border/70 last:border-b-0">
      <div className="flex items-center gap-4">
        <span className={`font-serif text-xl font-bold w-14 ${isAwaiting ? 'text-muted-foreground/40' : 'text-emerald-700'}`}>
          {checkin.code}
        </span>
        <div>
          <div className="text-sm font-semibold text-foreground">{checkin.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{checkin.note}</div>
        </div>
      </div>
      {isAwaiting
        ? <span className="text-xs text-muted-foreground flex-shrink-0">Awaiting</span>
        : <StatusPill status={checkin.status} toneMap={CHECKIN_TONE} />}
    </div>
  );
}

function CohortStat({ label, value, sub, tone }) {
  const toneClass = { emerald: 'text-emerald-600' }[tone] ?? 'text-foreground';
  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className={`font-serif text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function AtRiskBanner({ note }) {
  if (!note) return null;
  return (
    <div className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg px-3 py-1.5 text-xs font-semibold">
      <AlertCircle className="h-3.5 w-3.5" /> {note}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ProbationStep — default export, used by pages/Onboarding.jsx
───────────────────────────────────────────────────────────────────────────── */

export function ProbationStep({ data, onBack }) {
  const { checkins, cohort, atRiskNote } = data;

  return (
    <StepCard
      icon={Activity}
      title="Component 03 · Probation 90 · ON-05 tracker"
      subtitle="Three structured manager check-ins. At-risk flags surface in Manager Inbox + Recovery Hub. Final 90-day decision drives confirmation or non-confirm."
      headerRight={
        <Button variant="outline" size="sm" className="text-xs">Schedule next check-in</Button>
      }
      footerLeft={<AtRiskBanner note={atRiskNote} />}
      footerRight={
        <button type="button" className="font-semibold text-foreground hover:underline">
          Run 60-day review →
        </button>
      }
    >
      <div className="p-6 space-y-4">
        <div className="border rounded-xl overflow-hidden">
          {checkins.map((c) => <CheckInRow key={c.code} checkin={c} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {cohort.map((c) => <CohortStat key={c.label} {...c} />)}
        </div>
      </div>
    </StepCard>
  );
}