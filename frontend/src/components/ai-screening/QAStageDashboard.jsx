import { useState } from 'react';
import { Clock, CheckCircle2, ChevronDown, ChevronRight, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from './shared';
import { getQaResponses } from '@/api/screening.api';

const QA_STATUS_BADGE = {
  sent:    { label: 'sent',    className: 'border-amber-300 text-amber-700 bg-amber-50' },
  draft:   { label: 'draft',   className: 'border-muted-foreground/30 text-muted-foreground bg-muted' },
  expired: { label: 'expired', className: 'border-rose-300 text-rose-700 bg-rose-50' },
};

export default function QAStageDashboard({
  pendingRows = [], respondedRows = [], undecidedCount = 0, onOpen,
  pendingTotal, page = 1, pageSize = 10, onPageChange,
  search = '', onSearchChange,
}) {
  // pendingTotal comes from the server (real count across all pages); fall
  // back to the current page's length only if a caller doesn't pass it.
  const totalPending = pendingTotal ?? pendingRows.length;
  const total = totalPending + respondedRows.length;
  const responseRate = total > 0 ? Math.round((respondedRows.length / total) * 100) : 0;
  const totalPages = Math.max(1, Math.ceil(totalPending / pageSize));

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Sent · awaiting reply" value={totalPending} />
        <StatCard label="Responded" value={respondedRows.length} />
        <StatCard label="Response rate" value={`${responseRate}%`} hint={total === 0 ? 'no Q&A sent yet' : undefined} />
        <StatCard
          label="Undecided"
          value={undecidedCount}
          hint="scored, no decision yet — responded or not"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {respondedRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground italic">No responses yet.</p>
          ) : (
            respondedRows.map((r) => <ResponseCard key={r.screening_id} row={r} onOpen={onOpen} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" /> Awaiting reply
            </span>
            {onSearchChange && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Candidate name…"
                  className="h-7 w-48 pl-7 text-[11px] normal-case font-normal tracking-normal"
                />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {pendingRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground italic">
              {search ? 'No candidates match your search.' : 'Nothing pending.'}
            </p>
          ) : (
            <>
              {pendingRows.map((r) => {
                const badge = QA_STATUS_BADGE[r.qa_status] || QA_STATUS_BADGE.sent;
                return (
                  <div
                    key={r.screening_id ?? r.applicant_id}
                    onClick={() => onOpen(r)}
                    className="flex items-center justify-between p-2.5 rounded-md border cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="text-xs font-medium">{r.applicant_name || `#${r.applicant_id}`}</div>
                    <Badge variant="outline" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                  </div>
                );
              })}

              {onPageChange && totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalPending)} of {totalPending}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                      Previous
                    </Button>
                    <span className="text-[11px] text-muted-foreground px-1">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResponseCard({ row, onOpen }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ WIRED: real API call, toast.error on failure instead of inline text
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !answers && !loading) {
      setLoading(true);
      try {
        const res = await getQaResponses(row.screening_id);
        setAnswers(res.data?.qa?.answers || []);
      } catch (err) {
        toast.error('Failed to load responses', {
          description: err.response?.data?.message || err.message || 'Unknown error',
        });
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="text-xs font-medium truncate">{row.applicant_name || `#${row.applicant_id}`}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">responded</Badge>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onOpen(row); }}
            className="text-[10px] text-primary hover:underline"
          >
            open profile
          </span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t bg-muted/10 space-y-2">
          {loading && (
            <div className="py-3 flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Loading responses…
            </div>
          )}
          {!loading && Array.isArray(answers) && answers.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No answers on record.</p>
          )}
          {!loading && Array.isArray(answers) && answers.map((a, i) => (
            <div key={i} className="text-xs rounded-md bg-background border p-2">
              <div className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">
                {a.topic || `Question ${i + 1}`}
              </div>
              <div className="mt-0.5 text-muted-foreground">{a.answer || <em>no answer</em>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
