import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge }    from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getSeekPostingFull } from '@/api/job-posting-seek.api';

const STATUS_COLORS = {
  Draft:     'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Running:   'bg-green-100 text-green-700',
  Expired:   'bg-red-100 text-red-700',
};

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  );
}

export function JobPostingViewDialog({ open, onOpenChange, posting }) {
  const [full, setFull]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !posting) return;
    setFull(null);
    setLoading(true);
    getSeekPostingFull(posting.id)
      .then(({ data }) => setFull(data.fullPosting))
      .catch(() => setFull(null))
      .finally(() => setLoading(false));
  }, [open, posting]);

  const data = full || posting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Posting Details</DialogTitle>
          <DialogDescription>{data?.job_title}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 py-2">
            <Field label="Job Title" value={data.job_title} />
            <Field label="Platform" value={
              <Badge variant={data.platform === 'seek' ? 'default' : 'secondary'}>
                {data.platform}
              </Badge>
            } />
            <div className="col-span-2">
              <Field label="Description" value={data.job_desc} />
            </div>
            <Field label="Location" value={data.job_location} />
            <Field label="Work Option" value={data.work_option} />
            <Field label="Work Type" value={data.work_type} />
            <Field label="Status" value={
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[data.status] ?? ''}`}>
                {data.status}
              </span>
            } />

            {/* Seek-specific fields */}
            {data.platform === 'seek' && (
              <>
                <Field label="Currency" value={data.currency} />
                <Field label="Pay Type" value={data.pay_type} />
                <Field label="Pay Min" value={data.pay_min} />
                <Field label="Pay Max" value={data.pay_max} />
                <Field label="Pay Display" value={data.pay_display} />
              </>
            )}

            <Field label="Created" value={data.created_at ? new Date(data.created_at).toLocaleString() : null} />
            <Field label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : null} />
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
