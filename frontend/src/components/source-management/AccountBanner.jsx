import { Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common';

const CONNECTION_VARIANT = {
  Connected: 'success',
  'Not Connected': 'muted',
  Error: 'danger',
};

/**
 * AccountBanner
 * Teal-tinted account context card shown at the top of each source-management
 * step, once we're scoped by a connected job account rather than a job.
 *
 * Props:
 *   account — the selected master_job_account row (required)
 *   step    — step number shown on the right e.g. 2 renders "STEP 2" (optional)
 */
export function AccountBanner({ account, step }) {
  if (!account) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold capitalize">{account.portal_name}</h3>
                {account.status_connection && (
                  <StatusBadge
                    label={account.status_connection}
                    variant={CONNECTION_VARIANT[account.status_connection] ?? 'muted'}
                    dot
                  />
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{account.email}</span>
              </div>
            </div>
          </div>
          {step && (
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest shrink-0">
              STEP {step}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
