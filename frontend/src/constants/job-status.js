// Shared job status → StatusBadge variant map.
// Use this everywhere a job/source status needs a badge.
//
// Usage:
//   import { JOB_STATUS_VARIANT } from '@/constants/job-status';
//   import { StatusBadge } from '@/components/common';
//
//   <StatusBadge label={job.status} variant={JOB_STATUS_VARIANT[job.status] ?? 'muted'} dot />

export const JOB_STATUS_VARIANT = {
  Active:  'success',
  Running: 'warning',
  Draft:   'muted',
  Expired: 'muted',
  Failed:  'danger',
  Blocked: 'danger',
};