import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, History } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getScoreHistory } from '@/api/applicant.api';

function scoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
}

/*
 * "View" modal for a Talent Pool applicant — every position they've been
 * scored against (candidate_job_score, one row per applicant+job) plus the
 * score for each, newest first. Replaces the table's single "latest score"
 * column with the full per-position history.
 */
export default function ApplicantHistoryModal({ open, onOpenChange, applicant }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!open || !applicant?.id) return;
    let cancelled = false;

    setHistory([]);
    setError(null);
    setLoading(true);

    getScoreHistory(applicant.id)
      .then((res) => { if (!cancelled) setHistory(res.data?.history || []); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load application history'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, applicant?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {applicant?.name || 'Applicant'}
          </DialogTitle>
          <DialogDescription>
            Positions this candidate has been matched against, with score.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              Not matched against any position yet.
            </p>
          ) : (
            history.map((h) => (
              <div
                key={h.job_id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{h.job_title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {h.job_status || '—'} · {formatDate(h.scored_at)}
                  </p>
                </div>
                <Badge className={`text-[10px] font-mono font-semibold shrink-0 ${scoreBg(h.overall_score)}`}>
                  {h.overall_score ?? '—'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
