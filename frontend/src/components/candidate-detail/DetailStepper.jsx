import { Check } from 'lucide-react';
import { STEPS } from './steps';

// 3-step header for the candidate detail page.
// Lifted visual pattern from CandidatePipeline.jsx / SourceManagement.jsx.

export default function DetailStepper({ activeKey, onSelect, completed = {} }) {
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);

  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast   = completed[step.key] || i < activeIndex;
        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect?.(step.key)}
              className="flex flex-col items-center gap-1 px-3 py-1 transition-colors"
            >
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : isPast
                      ? 'bg-primary/80 text-white'
                      : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {isPast && !isActive ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="text-center">
                <div className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </div>
                <div className="text-[9px] text-muted-foreground/80">{step.caption}</div>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 mb-5 ${isPast ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
