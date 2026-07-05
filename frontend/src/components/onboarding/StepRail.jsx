import { Check } from 'lucide-react';

const STEPS = [
  { key: 'preBoarding', number: 1, label: 'Pre-Boarding', sub: 'docs + buddy + HRIS' },
  { key: 'dayOneThirty', number: 2, label: 'Day 1–30', sub: 'orientation' },
  { key: 'probation', number: 3, label: 'Probation 90', sub: '30/60/90 check-ins' },
];

export function StepRail({ activeKey, onSelect }) {
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);

  return (
    <div className="grid grid-cols-3 border rounded-xl overflow-hidden bg-card">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone   = i < activeIndex;

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect(step.key)}
            className={`
              flex items-center gap-3 px-5 py-4 text-left transition-colors
              ${i > 0 ? 'border-l border-border/70' : ''}
              ${isActive ? 'bg-foreground text-background' : 'bg-card hover:bg-muted/40'}
            `}
          >
            <span className={`
              h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${isActive
                ? 'bg-amber-400 text-foreground'
                : isDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'}
            `}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
            </span>
            <div className="min-w-0">
              <div className={`text-sm font-semibold truncate ${isActive ? 'text-background' : 'text-foreground'}`}>
                {step.label}
              </div>
              {step.sub && (
                <div className={`text-xs truncate ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {step.sub}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}