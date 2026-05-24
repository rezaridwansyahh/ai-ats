import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BATTERIES } from '@/lib/batteries';

// Tab 1: battery picker. Four cards (A/B/C/D) selectable. Below: test sequence of the chosen battery.
// "Send invitation" → parent advances to Take tab.
export default function SetupTab({ selectedBattery, onSelectBattery, onSendInvitation }) {
  const codes = ['A', 'B', 'C', 'D'];
  const active = selectedBattery ? BATTERIES[selectedBattery] : null;

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Setup · pick a battery</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Choose the assessment battery that best fits this role. Recruiter override is fine.
            </p>
          </div>
          {selectedBattery && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-primary">
              Battery {selectedBattery} selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {codes.map((code) => {
            const b = BATTERIES[code];
            const isActive = code === selectedBattery;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onSelectBattery?.(code)}
                className={[
                  'text-left rounded-lg border p-4 transition-colors',
                  isActive
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Battery {b.code} · {b.label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold tracking-wider uppercase text-primary">selected</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {b.test_count} tests · {b.duration} · {b.blurb}
                </div>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
              Test sequence in Battery {active.code}
            </div>
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
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            disabled={!selectedBattery}
            onClick={onSendInvitation}
          >
            Send invitation →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
