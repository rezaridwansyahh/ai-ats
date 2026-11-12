import { AlertTriangle, ArrowLeft, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BATTERIES } from '@/lib/batteries';

// Lettered batteries (A-D) are labelled "Battery X · Name"; multi-word codes
// like 'External' read better as just the name on its own.
export const batteryDisplayName = (b) => (/^[A-Z]$/.test(b.code) ? `Battery ${b.code} · ${b.label}` : b.label);

export const INTERNAL_CODES = ['A', 'B', 'C', 'D'];
export const EXTERNAL_CODES = ['External'];

export default function BatteryStep({ form, setField, isLocked, missingRequired, showValidation, step = 3, totalSteps = 5, onStepChange }) {
  const isMissing = showValidation && missingRequired.includes('assessment_battery');
  const locked = isLocked('assessment_battery');
  const active = form.assessment_battery ? BATTERIES[form.assessment_battery] : null;

  const renderTile = (code) => {
    const b = BATTERIES[code];
    const isActive = code === form.assessment_battery;
    return (
      <button
        key={code}
        type="button"
        disabled={locked}
        aria-disabled={locked}
        onClick={() => !locked && setField('assessment_battery', code)}
        className={[
          'text-left rounded-lg border p-4 transition-colors',
          locked
            ? 'border-border bg-muted/40 opacity-50 cursor-not-allowed'
            : isActive
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
              : 'border-border bg-card hover:border-primary/40',
        ].join(' ')}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            {batteryDisplayName(b)}
          </span>
          {isActive && (
            <span className="text-[9px] font-bold tracking-wider uppercase text-primary">selected</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {b.test_count > 0 ? `${b.test_count} tests · ${b.duration} · ` : ''}{b.blurb}
        </div>
      </button>
    );
  };

  return (
    <Card data-wizard="battery-card" className="py-4 gap-3">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Button
          variant="ghost" size="icon" className="h-7 w-7 shrink-0"
          disabled={step === 0}
          onClick={() => onStepChange?.(Math.max(0, step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-sm flex items-center gap-2 flex-1 justify-center">
          <ClipboardCheck className="h-4 w-4 text-primary" /> Assessment battery
          <span className="text-rose-600">*</span>
        </CardTitle>
        <Button
          variant="ghost" size="icon" className="h-7 w-7 shrink-0"
          disabled={step === totalSteps - 1}
          onClick={() => onStepChange?.(Math.min(totalSteps - 1, step + 1))}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Every candidate invited to Psych Assessment for this job takes this battery.
          Choose it now — recruiters won't need to pick it per candidate anymore.
        </p>

        {isMissing && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Select a battery to publish this job.
          </div>
        )}

        {locked && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Locked — this job is published and candidates may already have results under{' '}
            <strong>{batteryDisplayName(BATTERIES[form.assessment_battery])}</strong>. Changing it isn't allowed once live.
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Internal</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTERNAL_CODES.map(renderTile)}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">External</p>
          <div className="grid grid-cols-1 gap-3">
            {EXTERNAL_CODES.map(renderTile)}
          </div>
        </div>

        {active && (
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
              {active.tests.length > 0 ? `Test sequence in Battery ${active.code}` : 'How this step works'}
            </div>
            {active.tests.length > 0 ? (
              <ol className="space-y-1.5">
                {active.tests.map((t, i) => (
                  <li key={t.key} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                    <span>
                      <span className="font-bold">{t.name}</span>
                      <span className="text-muted-foreground"> · {t.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">{active.blurb}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
