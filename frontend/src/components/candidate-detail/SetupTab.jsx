import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { BATTERIES } from '@/lib/batteries';

// Tab 1: battery picker. Four cards (A/B/C/D) selectable. Below: test sequence of the chosen battery.
// "Send invitation" → parent advances to Take tab.
export default function SetupTab({ selectedBattery, onSelectBattery, onSendInvitation, lockedBattery = null }) {
  const codes = ['A', 'B', 'C', 'D', 'I', 'T'];
  const active = selectedBattery ? BATTERIES[selectedBattery] : null;
  const canInvite = active ? active.invitable !== false : false;

  // One-battery-per-(candidate, job): if the server says a battery is already locked
  // in for this candidate/job, force the local selection to match. Prevents the
  // parent's stale local state from showing the wrong battery's test sequence.
  useEffect(() => {
    if (lockedBattery && selectedBattery !== lockedBattery) {
      onSelectBattery?.(lockedBattery);
    }
  }, [lockedBattery, selectedBattery, onSelectBattery]);

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

        {lockedBattery && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              This candidate already has <strong>Battery {lockedBattery}</strong> for this job.
              To switch batteries, revoke the existing invitation in <strong>Take</strong> first.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {codes.map((code) => {
            const b = BATTERIES[code];
            const isActive = code === selectedBattery;
            const isLocked = !!lockedBattery && code !== lockedBattery;
            return (
              <button
                key={code}
                type="button"
                disabled={isLocked}
                aria-disabled={isLocked}
                onClick={() => { if (!isLocked) onSelectBattery?.(code); }}
                className={[
                  'text-left rounded-lg border p-4 transition-colors',
                  isLocked
                    ? 'border-border bg-muted/40 opacity-50 cursor-not-allowed'
                    : isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Battery {b.code} · {b.label}
                  </span>
                  {lockedBattery && code === lockedBattery && (
                    <span className="text-[9px] font-bold tracking-wider uppercase text-amber-700 inline-flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" />locked
                    </span>
                  )}
                  {!lockedBattery && isActive && (
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
          {active && !canInvite && (
            <span className="text-[10.5px] text-muted-foreground italic mr-auto">
              No invitation flow for {active.label} yet — kandidat takes it via the <strong>Asesmen</strong> menu.
            </span>
          )}
          <Button
            size="sm"
            disabled={!selectedBattery || !canInvite}
            onClick={onSendInvitation}
          >
            Send invitation →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
