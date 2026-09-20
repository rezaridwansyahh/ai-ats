import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BATTERIES } from '@/lib/batteries';

export default function SetupTab({ jobId, jobBattery, onSendInvitation }) {
  const active = jobBattery ? BATTERIES[jobBattery] : null;

  if (!active) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              No assessment battery is configured for this job yet. Set one in{' '}
              {jobId ? (
                <Link to={`/sourcing/job-management/${jobId}/edit`} className="underline font-semibold">
                  Job Management
                </Link>
              ) : (
                <strong>Job Management</strong>
              )}{' '}
              before inviting this candidate.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold">Setup · assessment battery</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Set once for this job in Job Management — applies to every candidate.
            </p>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-primary inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Battery {jobBattery}
          </span>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
            Battery {active.code} · {active.label} — {active.test_count} tests · {active.duration}
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

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button size="sm" onClick={onSendInvitation}>
            Continue to Take <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}