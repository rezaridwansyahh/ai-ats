import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepCard } from './shared';

const ROLLUP_TONE = {
  emerald: 'text-emerald-700',
  amber:   'text-amber-700',
  muted:   'text-muted-foreground/40',
};

function RollupCard({ label, count, note, tone }) {
  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className={`font-serif text-4xl font-bold ${ROLLUP_TONE[tone]}`}>{count}</div>
      <div className="text-sm text-muted-foreground mt-2">{note}</div>
    </div>
  );
}

export function DecideStep({ data, onSendToCandidate, onAdvance }) {
  const { heading, subtitle, cleared, conditional, unfit, statusPill } = data;

  return (
    <StepCard
      icon={CheckCheck}
      title={heading}
      subtitle={subtitle}
      footerLeft={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> {statusPill}
        </span>
      }
      footerRight={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onSendToCandidate} className="text-xs">
            Send to candidate
          </Button>
          <button type="button" onClick={onAdvance} className="font-semibold text-foreground hover:underline text-sm">
            Advance to BG Check →
          </button>
        </div>
      }
    >
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RollupCard label="Cleared"    count={cleared.count}     note={cleared.names}   tone="emerald" />
        <RollupCard label="Conditional" count={conditional.count} note={conditional.note} tone="amber" />
        <RollupCard label="Unfit"      count={unfit.count}       note={unfit.note}      tone="muted" />
      </div>
    </StepCard>
  );
}