import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

import { getInterviewPack } from '@/api/interview-pack.api';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function fmtDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-AU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function RecommendationBadge({ rec }) {
  if (!rec) return <span className="text-xs text-muted-foreground">Pending</span>;
  const map = {
    advance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hold:    'bg-amber-50 text-amber-700 border-amber-200',
    reject:  'bg-red-50 text-red-600 border-red-200',
  };
  const tone = map[rec] || 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${tone}`}>
      {rec}
    </span>
  );
}

function StatusBadge({ status }) {
  const tone = status === 'submitted'
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
    : 'bg-blue-50 text-blue-600 border-blue-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

export function PackDetailDialog({ open, onOpenChange, packId }) {
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !packId) return;
    setLoading(true);
    setError('');
    setPack(null);
    getInterviewPack(packId)
      .then((r) => setPack(r.data?.pack || r.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load pack.'))
      .finally(() => setLoading(false));
  }, [open, packId]);

  const candidates = pack?.candidates || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Pack Detail</DialogTitle>
          <DialogDescription>
            Review outcomes and scores for this interview pack.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {pack && (
          <div className="space-y-5">
            {/* Pack header */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{pack.title || 'Interview Pack'}</h3>
                <StatusBadge status={pack.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {pack.job_title || '—'}
                {pack.batch_code && <> · Batch {pack.batch_code}</>}
              </p>
              <p className="text-xs text-muted-foreground">
                Interviewer: <span className="text-foreground">{pack.interviewer_name || '—'}</span>
              </p>
              {(pack.window_start || pack.window_end) && (
                <p className="text-xs text-muted-foreground">
                  Window: {fmtDate(pack.window_start)} – {fmtDate(pack.window_end)}
                </p>
              )}
              {pack.status === 'submitted' && pack.submitted_at && (
                <p className="text-xs text-emerald-600 font-medium">
                  Submitted on {fmtDateTime(pack.submitted_at)}
                </p>
              )}
            </div>

            {/* Candidates table */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Candidates · {candidates.length}
              </p>
              {candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No candidates in this pack.</p>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Candidate</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Score</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Recommendation</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground hidden md:table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c, i) => {
                        const outcome = c.outcome || {};
                        const score = outcome.weighted_total ?? outcome.scores?.weighted_total;
                        return (
                          <tr
                            key={c.pack_candidate_id ?? c.applicant_id ?? i}
                            className="border-b border-border last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-sm">{c.applicant_name || `Applicant #${c.applicant_id}`}</p>
                              {c.last_position && (
                                <p className="text-xs text-muted-foreground">{c.last_position}</p>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-sm font-mono">
                              {score != null ? Number(score).toFixed(2) : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              <RecommendationBadge rec={outcome.recommendation} />
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell">
                              <div className="space-y-0.5">
                                {outcome.strengths && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    <span className="font-medium text-foreground">+ </span>{outcome.strengths}
                                  </p>
                                )}
                                {outcome.concerns && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    <span className="font-medium text-red-500">- </span>{outcome.concerns}
                                  </p>
                                )}
                                {!outcome.strengths && !outcome.concerns && (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
