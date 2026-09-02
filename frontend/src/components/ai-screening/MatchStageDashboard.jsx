import { useMemo, useState } from 'react';
import {
  ChevronUp, ChevronDown, Loader2, PlayCircle, ArrowRight, Eye, MapPin, CalendarDays,
  Check, X, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { StatCard } from './shared';
import { scoreCandidatesList, generateQa, sendQa } from '@/api/screening.api';
import MatchPreviewModal from './MatchPreviewModal';

const SORT_OPTIONS = [
  { value: 'overall_score', label: 'Sort: Fit' },
  { value: 'skills_score', label: 'Sort: Skills' },
  { value: 'experience_score', label: 'Sort: Experience' },
  { value: 'education_score', label: 'Sort: Education' },
];

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toISOString().slice(0, 10); } catch { return null; }
}

/*
 * Job-level "AI Matching" dashboard.
 *
 * ✅ WIRED (this pass): "Run Matching for all pending" button below calls the
 * real matchBulk(job_id, applicant_ids) endpoint — confirmed complete on the
 * backend (screening.service.js > matchBulk) and signature-matched against
 * screening.api.js. On success, calls onScored() so the parent (AIScreeningPage)
 * reloads parseRows/matchRows/qaRows/cohortRows and this list updates itself.
 *
 * Everything else in this file is unchanged from the previous pass — still
 * read-only pending/scored lists, still no job-wide rubric editing here.
 */
export default function MatchStageDashboard({ jobId, pendingRows = [], scoredRows = [], onOpen, onScored }) {
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortDir, setSortDir] = useState('desc');
  const [running, setRunning] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [advancing, setAdvancing] = useState(false);

  const sorted = useMemo(() => {
    const list = [...scoredRows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      if (av === bv) return 0;
      const diff = av < bv ? -1 : 1;
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [scoredRows, sortKey, sortDir]);

  const rowId = (r) => r.screening_id ?? r.applicant_id;
  const allSelected = sorted.length > 0 && sorted.every((r) => selectedIds.has(rowId(r)));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(sorted.map(rowId)));
  };

  const toggleSelectRow = (r) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const id = rowId(r);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAdvanceToQa = async () => {
    const selectedRows = sorted.filter((r) => selectedIds.has(rowId(r)));
    // Generating Q&A on a screening that already has one resets its answers/token —
    // only touch candidates who've never had a Q&A set generated for them.
    const eligible = selectedRows.filter((r) => !r.qa_status && r.screening_id);
    const skipped = selectedRows.length - eligible.length;

    if (eligible.length === 0) {
      toast.error('Nothing to advance', {
        description: skipped > 0 ? 'Selected candidates already have Follow-up Q&A in progress.' : 'Select at least one candidate first.',
      });
      return;
    }

    setAdvancing(true);
    try {
      const outcomes = await Promise.allSettled(
        eligible.map(async (r) => {
          await generateQa(r.screening_id, {});
          await sendQa(r.screening_id);
        })
      );
      const failed = outcomes.filter((o) => o.status === 'rejected');
      if (failed.length > 0) {
        toast.error('Some candidates failed to advance', {
          description: `${eligible.length - failed.length}/${eligible.length} advanced to QA · ${failed.length} failed.`,
        });
        console.warn('Advance to QA errors:', failed.map((f) => f.reason));
      } else {
        toast.success('Advanced to QA', {
          description: `${eligible.length} candidate${eligible.length === 1 ? '' : 's'} sent Follow-up Q&A.${skipped > 0 ? ` ${skipped} skipped (already in progress).` : ''}`,
        });
      }
      setSelectedIds(new Set());
      await onScored?.();
    } finally {
      setAdvancing(false);
    }
  };

  const topScore = scoredRows.reduce((m, r) => Math.max(m, r.overall_score ?? 0), 0);
  const avgScore = scoredRows.length
    ? Math.round(scoredRows.reduce((s, r) => s + (r.overall_score ?? 0), 0) / scoredRows.length)
    : 0;

  const handleRunPending = async () => {
    if (!jobId || pendingRows.length === 0 || running) return;
    setRunning(true);
    try {
      const applicant_ids = pendingRows.map((r) => r.applicant_id);
      const res = await scoreCandidatesList(jobId, applicant_ids);
      const { scored = 0, total = 0, errors = [] } = res.data || {};
      if (errors.length > 0) {
        toast.error('Bulk scoring finished with errors', {
          description: `${scored}/${total} scored · ${errors.length} failed. Check console for details.`,
        });
        console.warn('scoreCandidatesList errors:', errors);
      } else {
        toast.success('Bulk scoring complete', {
          description: `${scored} of ${total} candidates scored.`,
        });
      }
      await onScored?.(); // ask AIScreeningPage to reload lane data
    } catch (err) {
      toast.error('Bulk scoring failed', {
        description: err.response?.data?.message || err.message || 'Unknown error',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* NEW: bulk run action, only shown when there's something pending */}
      {pendingRows.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{pendingRows.length} candidate{pendingRows.length === 1 ? '' : 's'}</span>
              {' '}waiting to be scored against this job's saved rubric.
            </div>
            <Button size="sm" className="text-xs" onClick={handleRunPending} disabled={running}>
              {running
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Scoring…</>
                : <><PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Score All Pending Candidates</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats (1/4) + Ranking table (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Awaiting Score" value={pendingRows.length} />
          <StatCard label="Scored" value={scoredRows.length} />
          <StatCard label="Top score" value={scoredRows.length ? topScore : '—'} />
          <StatCard label="Avg score" value={scoredRows.length ? avgScore : '—'} />
        </div>

        <Card className="lg:col-span-3">
          <CardContent className="space-y-3 pt-6">
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground italic">No candidates scored yet.</p>
            ) : (
              <>
                {/* Toolbar: select-all + sort */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox id="select-all-scored" checked={allSelected} onCheckedChange={toggleSelectAll} />
                    <label htmlFor="select-all-scored" className="text-xs text-muted-foreground cursor-pointer select-none">
                      {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                    </label>
                    {selectedIds.size > 0 && (
                      <Button
                        size="sm"
                        className="h-7 text-[11px] gap-1"
                        onClick={handleAdvanceToQa}
                        disabled={advancing}
                      >
                        {advancing
                          ? <><Loader2 className="h-3 w-3 animate-spin" /> Advancing…</>
                          : <>Advance to QA <ArrowRight className="h-3 w-3" /></>}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Select value={sortKey} onValueChange={setSortKey}>
                      <SelectTrigger className="h-7 w-[150px] text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
                      onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                    >
                      {sortDir === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Candidate cards */}
                <div className="space-y-2.5">
                  {sorted.map((r) => (
                    <CandidateCard
                      key={rowId(r)}
                      row={r}
                      selected={selectedIds.has(rowId(r))}
                      onToggleSelect={() => toggleSelectRow(r)}
                      onView={() => setPreviewRow(r)}
                      onContinue={() => onOpen(r)}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <MatchPreviewModal
        open={!!previewRow}
        onOpenChange={(v) => { if (!v) setPreviewRow(null); }}
        row={previewRow}
        jobId={jobId}
      />

      {/* Pending list — unchanged, just no longer the only way to trigger matching */}
      {pendingRows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Awaiting score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="w-full">
              <TableBody>
                {pendingRows.map((r) => (
                  <TableRow key={r.screening_id ?? r.applicant_id} className="cursor-pointer hover:bg-muted/30" onClick={() => onOpen(r)}>
                    <TableCell className="text-xs pl-4">{r.applicant_name || `#${r.applicant_id}`}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.last_position || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CandidateCard({ row: r, selected, onToggleSelect, onView, onContinue }) {
  const matched = Array.isArray(r.matched_skills) ? r.matched_skills : [];
  const missing = Array.isArray(r.missing_skills) ? r.missing_skills : [];
  const appliedAt = fmtDate(r.applied_at);

  return (
    <Card className={selected ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5 min-w-0">
            <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
              <div className="text-[11px] text-muted-foreground truncate">{r.last_position || '—'}</div>
              <div className="mt-1 flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
                {r.address && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.address}</span>
                )}
                {appliedAt && (
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Applied {appliedAt}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={onView}>
              <Eye className="h-3 w-3" /> View
            </Button>
            <Button size="sm" className="h-7 text-[11px] gap-1" onClick={onContinue}>
              Progress <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <ScoreTile label="Fit" score={r.overall_score} bold />
          <ScoreTile label="Skills" score={r.skills_score} />
          <ScoreTile label="Experience" score={r.experience_score} />
          <ScoreTile label="Education" score={r.education_score} />
        </div>

        {(matched.length > 0 || missing.length > 0) && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {matched.slice(0, 8).map((s) => (
              <Badge key={`m-${s}`} className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{s}</Badge>
            ))}
            {missing.slice(0, 4).map((s) => (
              <Badge key={`x-${s}`} variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">{s}</Badge>
            ))}
          </div>
        )}

        <PreferenceMatch information={r.application_qa} />
      </CardContent>
    </Card>
  );
}

function PreferenceMatch({ information }) {
  const [open, setOpen] = useState(true);
  const entries = information && typeof information === 'object' ? Object.entries(information) : [];
  const matchCount = entries.filter(([, v]) => v?.meets_requirement === true).length;

  return (
    <div className="pt-2 border-t">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] font-medium hover:text-primary"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Kecocokan preferensi ({matchCount}/{entries.length} cocok)
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {entries.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No screening questions recorded.</p>
          ) : (
            entries.map(([question, v]) => {
              const meets = v?.meets_requirement;
              const Icon = meets === true ? Check : meets === false ? X : Minus;
              const iconCls = meets === true ? 'text-emerald-600' : meets === false ? 'text-rose-600' : 'text-muted-foreground';
              return (
                <div key={question} className="grid grid-cols-[10px_160px_1fr] gap-2 text-[11px]">
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground break-words">{question}</span>
                  <span className="flex items-center gap-1 font-medium break-words">
                    <Icon className={`h-3 w-3 shrink-0 ${iconCls}`} />
                    {v?.answer || '—'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ScoreTile({ label, score, bold }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono ${bold ? 'text-sm font-bold' : 'text-xs font-semibold'}`}>
        {score ?? '—'}
      </div>
    </div>
  );
}