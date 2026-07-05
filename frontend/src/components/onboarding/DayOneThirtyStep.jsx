import { Calendar, Bell, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepCard } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components used only within DayOneThirty
───────────────────────────────────────────────────────────────────────────── */

function MilestoneRow({ item }) {
  const isDone = item.status === 'done';
  const isCurrent = item.status === 'inProgress';
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {isDone
        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        : <Circle className={`h-4 w-4 flex-shrink-0 ${isCurrent ? 'text-amber-500 fill-amber-100' : 'text-muted-foreground/40'}`} />}
      <span className={`text-sm ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
        {item.label}
      </span>
    </div>
  );
}

function WeekColumn({ title, items }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <div>
        {items.map((item) => <MilestoneRow key={item.label} item={item} />)}
      </div>
    </div>
  );
}

function ManagerNudgeBanner({ nudge }) {
  if (!nudge) return null;
  return (
    <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm">
      <Bell className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
      <div className="text-indigo-900">
        <span className="font-bold">Manager nudge.</span> {nudge.text}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DayOneThirtyStep — default export, used by pages/Onboarding.jsx
───────────────────────────────────────────────────────────────────────────── */

export function DayOneThirtyStep({ data, onNext }) {
  const { weeks, nudge, dayOf, totalDays, milestonesDone, milestonesTotal } = data;

  return (
    <StepCard
      icon={Calendar}
      title="Component 02 · Day 1–30 · orientation"
      subtitle="Daily ramp-up checklist owned by manager + buddy. Auto-flags missed milestones to Manager Inbox."
      headerRight={
        <button type="button" className="font-semibold text-foreground hover:underline">Customize template</button>
      }
      footerLeft={`Day ${dayOf} of ${totalDays} · ${milestonesDone} of ${milestonesTotal} milestones complete`}
      footerRight={
        <button type="button" onClick={onNext} className="font-semibold text-foreground hover:underline">
          Move to Probation 90 →
        </button>
      }
    >
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {weeks.map((w) => <WeekColumn key={w.title} title={w.title} items={w.items} />)}
        </div>
        <ManagerNudgeBanner nudge={nudge} />
      </div>
    </StepCard>
  );
}