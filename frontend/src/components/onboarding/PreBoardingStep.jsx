import { Circle, CheckCircle2, User, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepCard, StatusPill } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Tone map for document checklist status
───────────────────────────────────────────────────────────────────────────── */

const DOC_TONE = {
  done:       { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Done' },
  inProgress: { pill: 'border-amber-200  bg-amber-50  text-amber-700',    dot: 'bg-amber-500',   label: 'In progress' },
  notStarted: { pill: 'border-border     bg-muted/40  text-muted-foreground', dot: 'bg-muted-foreground/40', label: 'Not started' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components used only within PreBoarding
───────────────────────────────────────────────────────────────────────────── */

function ChecklistRow({ item }) {
  const isDone = item.status === 'done';
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 last:border-b-0">
      <div className="flex items-center gap-3">
        {isDone
          ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          : <Circle className={`h-4 w-4 flex-shrink-0 ${item.status === 'inProgress' ? 'text-amber-500 fill-amber-100' : 'text-muted-foreground/40'}`} />}
        <span className="text-sm text-foreground">{item.label}</span>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{item.owner}</span>
    </div>
  );
}

function BuddyCard({ buddy, onChange }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {buddy.code} · Buddy
        </div>
        <button type="button" onClick={onChange} className="text-xs font-semibold text-foreground hover:underline">
          Change
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
          {buddy.initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{buddy.name}</div>
          <div className="text-xs text-muted-foreground">{buddy.meta}</div>
        </div>
      </div>
    </div>
  );
}

function DaySchedule({ schedule }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Day-1 Schedule
      </div>
      <div className="space-y-2.5">
        {schedule.map((s) => (
          <div key={s.time} className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{s.time}</span>
            <span className="text-muted-foreground text-right">{s.activity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WelcomeMessage({ message }) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
        Welcome Message · {message.from}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PreBoardingStep — default export, used by pages/Onboarding.jsx
───────────────────────────────────────────────────────────────────────────── */

export function PreBoardingStep({ data, candidateName, onNext }) {
  const { checklist, hrisTask, buddy, schedule, welcomeMessage, startDate, daysUntilStart, pctComplete } = data;

  return (
    <StepCard
      icon={FileText}
      title={`Component 01 · Pre-Boarding · ${candidateName}`}
      subtitle="Auto-created on contract.signed. Pre-populated from offer + candidate profile. Owner can push to HRIS, assign a buddy, and queue welcome materials."
      headerRight={
        <>
          <button type="button" className="font-semibold text-foreground hover:underline">Resend welcome pack</button>
          <button type="button" className="font-semibold text-foreground hover:underline">Open candidate profile</button>
        </>
      }
      footerLeft={`Start date ${startDate} · ${daysUntilStart} days · pre-board ${pctComplete}% complete`}
      footerRight={
        <button type="button" onClick={onNext} className="font-semibold text-foreground hover:underline">
          Move to Day 1–30 →
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">

        <div className="lg:col-span-2 p-4 space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Document Checklist
            </div>
            {checklist.map((item) => <ChecklistRow key={item.label} item={item} />)}
          </div>

          <div className="flex items-center justify-between gap-3 border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{hrisTask.code}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{hrisTask.title}</div>
                <div className="text-xs text-muted-foreground">{hrisTask.description}</div>
              </div>
            </div>
            <Button size="sm" className="text-xs flex-shrink-0">{hrisTask.action}</Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <BuddyCard buddy={buddy} onChange={() => {}} />
          <DaySchedule schedule={schedule} />
          <WelcomeMessage message={welcomeMessage} />
        </div>

      </div>
    </StepCard>
  );
}