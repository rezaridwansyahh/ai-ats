import { Briefcase, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common';
import { JOB_STATUS_VARIANT } from '@/constants/job-status';

/**
 * JobBanner
 * Teal-tinted job context card shown at the top of each source-management step.
 *
 * Props:
 *   job   — the selected job object (required)
 *   step  — step number shown on the right e.g. 2 renders "STEP 2" (optional)
 */
export function JobBanner({ job, step }) {
  if (!job) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">{job.job_title}</h3>
                {job.status && (
                  <StatusBadge
                    label={job.status}
                    variant={JOB_STATUS_VARIANT[job.status] ?? 'muted'}
                    dot
                  />
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                {job.job_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.job_location}
                  </span>
                )}
                {job.work_type   && <span>{job.work_type}</span>}
                {job.work_option && <span>{job.work_option}</span>}
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