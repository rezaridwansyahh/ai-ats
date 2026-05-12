// Shared display helpers for rendering a job in a row/table — used by
// JobManagement's selector table and CandidatePipeline's Step 01 selector.
// Keep both lists visually identical so recruiters can pick a job the same
// way everywhere.

export const ROLE_CLASSES = {
  internship:         { label: 'Intern',       dot: 'bg-amber-400',  pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  'entry level':      { label: 'Operator',     dot: 'bg-amber-500',  pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  associate:          { label: 'Associate',    dot: 'bg-sky-500',    pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  'mid-senior level': { label: 'Office Staff', dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  director:           { label: 'Leadership',   dot: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  executive:          { label: 'Executive',    dot: 'bg-purple-600', pill: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function getRoleClass(job) {
  const key = (job.seniority_level || '').toLowerCase();
  if (ROLE_CLASSES[key]) return ROLE_CLASSES[key];
  if (job.work_type === 'Contract') return { label: 'Sales', dot: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700 border-purple-200' };
  return { label: job.work_type || 'Role', dot: 'bg-slate-400', pill: 'bg-slate-50 text-slate-700 border-slate-200' };
}

export function formatSalaryBand(job) {
  if (!job.pay_min && !job.pay_max) return '—';
  if (job.pay_display === 'Hide') return 'Hidden';
  const fmt = (n) => {
    if (n == null) return '';
    if (job.currency === 'IDR') return `Rp ${Number(n).toLocaleString('id-ID')}`;
    return `${job.currency || ''} ${Number(n).toLocaleString()}`.trim();
  };
  if (job.pay_min && job.pay_max) return `${fmt(job.pay_min)} – ${fmt(job.pay_max)}`;
  return fmt(job.pay_min || job.pay_max);
}

export function formatSinceDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch { return null; }
}

export function getStatusPill(status) {
  switch (status) {
    case 'Active':  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Running': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Draft':   return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Expired': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'Failed':  return 'bg-red-50 text-red-700 border-red-200';
    default:        return 'bg-muted text-muted-foreground border-border';
  }
}

export const JOB_STATUS_OPTIONS = ['Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked'];
