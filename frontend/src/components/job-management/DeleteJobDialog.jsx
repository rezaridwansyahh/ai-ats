import { AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function DeleteJobDialog({ open, onOpenChange, job, onConfirm, loading }) {
  const isActive = job?.status === 'Active' || job?.status === 'Running';
  const applicantCount = job?.candidate_count ?? 0;

  const handleDelete = async () => {
    try {
      await onConfirm(job.id);
      onOpenChange(false);
    } catch {
      // error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isActive && <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />}
            Delete Job
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{job?.job_title}</span>? This
              permanently removes the job and everything tied to it — pipeline stages, channel
              postings, and applicant records — and cannot be undone.
            </span>
            {isActive && (
              <span className="block rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This job is currently <strong>{job?.status}</strong>
                {applicantCount > 0 && <> with <strong>{applicantCount}</strong> applicant{applicantCount === 1 ? '' : 's'} in the pipeline</>}.
                Deleting it removes any live channel postings and all associated candidate data immediately.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting…' : isActive ? 'Delete Anyway' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
