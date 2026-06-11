import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Pill row matching the AI Screening sub-stage filter (AIScreeningWorkboard.jsx).
// Single-select: clicking the active pill clears the filter. Counts come from
// the parent — they always show full totals (unaffected by the active filter).
const STEP_META = {
  setup:  { label: 'Setup',          color: 'bg-slate-100 text-slate-700'       },
  take:   { label: 'Take',           color: 'bg-blue-100 text-blue-700'         },
  decide: { label: 'Score & Decide', color: 'bg-emerald-100 text-emerald-700'   },
};
const ORDER = ['setup', 'take', 'decide'];

export default function StepFilterBar({ counts, activeStep, onChange }) {
  const toggle = (step) => onChange?.(activeStep === step ? null : step);
  const clear  = () => onChange?.(null);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            By step · click to filter
          </span>
          {ORDER.map((step) => {
            const meta   = STEP_META[step];
            const count  = counts?.[step] ?? 0;
            const active = activeStep === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => toggle(step)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : `${meta.color} border-transparent hover:brightness-95 cursor-pointer`
                }`}
              >
                <span className="font-mono">{count}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
          {activeStep && (
            <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-muted-foreground">
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
