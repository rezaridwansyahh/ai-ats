import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function RevokeSessionDialog({ open, onOpenChange, session, onConfirm, loading }) {
  const battery = session?.battery ?? '—';
  const inProgress = session?.status === 'in_progress';

  const handleRevoke = async () => {
    try {
      await onConfirm(session?.id);
      onOpenChange(false);
    } catch {
      // error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke invitation link</DialogTitle>
          <DialogDescription>
            The candidate will no longer be able to open the Battery {battery} link.
            You can generate a new invitation afterwards.
          </DialogDescription>
        </DialogHeader>

        {inProgress && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              The candidate has already started this assessment. Revoking will discard
              their partial answers — this cannot be undone.
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? 'Revoking…' : 'Revoke link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
