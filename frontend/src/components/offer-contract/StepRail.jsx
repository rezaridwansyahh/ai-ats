import { Check } from 'lucide-react';

const STEPS = [
  { key: 'remuneration', number: 1, label: 'Remuneration' },
  { key: 'offerLetter',  number: 2, label: 'Offer Letter' },
  { key: 'contract',     number: 3, label: 'Contract' },
  { key: 'eSignature',   number: 4, label: 'E-Signature' },
  { key: 'pipeline',     number: 5, label: 'Offer Pipeline' },
];

export function StepRail({ activeKey, onSelect }) {
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);

  return (
    <div className="grid grid-cols-5 border rounded-xl overflow-hidden bg-card">
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
            <div className={`text-sm font-semibold truncate ${isActive ? 'text-background' : 'text-foreground'}`}>
              {step.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}