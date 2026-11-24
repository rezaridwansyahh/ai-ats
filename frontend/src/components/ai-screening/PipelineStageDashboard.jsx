import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, Eye, Loader2, MessageSquare, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { scoreRecommendation } from './shared';
import CandidateDetailModal from '@/components/job-management/CandidateDetailModal';
import { getQaResponses } from '@/api/screening.api';

function scoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

// Q&A is optional for this lane (see AI Screening's Match/QA/Ready split) —
// most rows will have no qa_status at all, which just renders as "—".
const QA_BADGE = {
  responded: { label: 'Responded', className: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  sent:      { label: 'Sent',      className: 'border-amber-300 text-amber-700 bg-amber-50' },
  draft:     { label: 'Draft',     className: 'border-muted-foreground/30 text-muted-foreground bg-muted' },
  expired:   { label: 'Expired',   className: 'border-rose-300 text-rose-700 bg-rose-50' },
};

const BUCKET_PILLS = [
  { key: '', label: 'All' },
  { key: 'advance', label: 'Advance' },
  { key: 'awaiting', label: 'Borderline' },
  { key: 'archive', label: 'Reject' },
];

const QA_FILLED_PILLS = [
  { key: '', label: 'All' },
  { key: 'filled', label: 'Filled Q&A' },
  { key: 'not_filled', label: 'Not filled' },
];

/*
 * Job-level "Screening Pipeline" dashboard — the server-side paginated,
 * filterable "Full screening decisions" table. Filter sidebar layout
 * mirrors MatchStageDashboard's "Filters" card (left sidebar Card, same
 * header/Clear-button/component styling) — unlike Match's client-side
 * filtering over an already-fully-fetched array, every filter here is a
 * real query param, since this tab is server-side paginated.
 *
 * Data contract:
 *   jobId — passed through to CandidateDetailModal (needs it for the match-score fetch)
 *   rows — the CURRENT PAGE of candidates (server-paginated+filtered)
 *   total, page, pageSize, onPageChange — pagination
 *   search, onSearchChange — name search (debounced upstream)
 *   bucket, onBucketChange — '' | 'advance' | 'awaiting' | 'archive'
 *   bucketCounts — { advance, awaiting, archive } counts for the pills,
 *     computed over the search+minScore+qaFilled filters (not bucket itself),
 *     so they stay accurate regardless of which bucket pill is selected
 *   minScore, onMinScoreChange — 0-100 floor on overall_score
 *   qaFilled, onQaFilledChange — '' | 'filled' | 'not_filled' — whether the
 *     candidate has any screening_qa row at all (Q&A is optional for this
 *     lane, so most rows won't)
 *   qaCounts — { filled, not_filled } counts for those pills, computed the
 *     same way bucketCounts is (ignoring qaFilled itself)
 *   onAdvance(ids, reason) — same advanceBulk() flow as AIScreeningPage
 *   advancing — bool, loading state for the advance button
 *
 * 🚧 TODO(backend): no reminder/archive-to-talent-pool endpoints exist —
 * those actions were part of the old three-column layout and haven't been
 * rebuilt elsewhere; only the real, wired advance action remains here.
 */
export default function PipelineStageDashboard({
  jobId,
  rows = [], total = 0, page = 1, pageSize = 10, onPageChange,
  search = '', onSearchChange,
  bucket = '', onBucketChange,
  bucketCounts = { advance: 0, awaiting: 0, archive: 0 },
  minScore = 0, onMinScoreChange,
  qaFilled = '', onQaFilledChange,
  qaCounts = { filled: 0, not_filled: 0 },
  advancing = false, onAdvance,
}) {
  const [selected, setSelected] = useState(new Set());
  const [reason, setReason] = useState('');
  const [viewCandidate, setViewCandidate] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [qaViewRow, setQaViewRow] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFiltered = Boolean(search || bucket || minScore > 0 || qaFilled);

  const resetFilters = () => {
    onSearchChange?.('');
    onBucketChange?.('');
    onMinScoreChange?.(0);
    onQaFilledChange?.('');
  };

  const handleView = (r) => {
    setViewCandidate({
      id: r.candidate_id,
      applicant_id: r.applicant_id,
      candidate_name: r.applicant_name,
      last_position: r.last_position,
      information: r.information,
    });
    setViewModalOpen(true);
  };

  // Keyed by candidate_id, not screening_id — a candidate_screening row is
  // only lazily created the first time their L3 profile is opened, so a
  // never-opened candidate's screening_id is legitimately null. Keying by
  // screening_id meant every never-opened candidate shared that same null
  // key, so selecting one silently selected all of them. candidate_id is
  // always present and unique per row.
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.candidate_id));
  // Adds/removes just THIS PAGE's rows — selections on other pages persist,
  // same as Talent Pool's bulk-select across pagination.
  const toggleAll = () => setSelected((cur) => {
    const next = new Set(cur);
    rows.forEach((r) => (allSelected ? next.delete(r.candidate_id) : next.add(r.candidate_id)));
    return next;
  });
  const toggle = (id) => setSelected((cur) => {
    const next = new Set(cur);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Reflects whatever onAdvance actually reports — not a guaranteed success.
  // A row can come back "skipped" (already decided) or "errored" (e.g. its
  // current stage isn't in this job's stage list), in which case it was
  // never moved, so the toast must say so rather than claim it advanced.
  const toastAdvanceResult = (result) => {
    const { advanced = [], skipped = [], errors = [] } = result || {};
    if (advanced.length > 0 && errors.length === 0 && skipped.length === 0) {
      toast.success('Candidates advanced', {
        description: `${advanced.length} candidate${advanced.length === 1 ? '' : 's'} moved to Interview.`,
      });
    } else if (advanced.length > 0) {
      toast.warning('Some candidates advanced', {
        description: `${advanced.length} moved to Interview · ${skipped.length} skipped · ${errors.length} errors.`,
      });
    } else {
      toast.error('Nothing advanced', {
        description: skipped.length > 0
          ? `${skipped.length} candidate(s) already had a decision — nothing moved.`
          : (errors[0]?.message || 'Could not advance the selected candidates.'),
      });
    }
  };

  const handleAdvanceClick = async () => {
    if (selected.size === 0 || !onAdvance) return;
    const result = await onAdvance([...selected], reason || undefined);
    setSelected(new Set());
    setReason('');
    toastAdvanceResult(result);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start p-4">
      {/* Left Sidebar Filters — mirrors MatchStageDashboard's Filters card */}
      <Card>
        <CardContent className="p-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Filters</span>
            {isFiltered && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-1.5" onClick={resetFilters}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>

          {/* Keyword Search */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Keyword</span>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Candidate name…"
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-7 w-full rounded-md border border-input bg-transparent pl-7 pr-2 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Recommendation bucket pills */}
          <div className="pt-2 border-t space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recommendation</span>
            <div className="flex flex-wrap gap-1.5">
              {BUCKET_PILLS.map((p) => {
                const count = p.key ? bucketCounts[p.key] ?? 0 : undefined;
                const isActive = bucket === p.key;
                return (
                  <button
                    key={p.key || 'all'}
                    type="button"
                    onClick={() => onBucketChange?.(p.key)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-transparent hover:brightness-95'
                    }`}
                  >
                    {p.label}
                    {count !== undefined && <span className="font-mono">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min Fit Slider */}
          <div className="pt-2 border-t space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Min. Fit</span>
              <span className="text-[11px] font-mono text-muted-foreground">{minScore}+</span>
            </div>
            <Slider value={[minScore]} min={0} max={100} step={5} onValueChange={([v]) => onMinScoreChange?.(v)} />
          </div>

          {/* Q&A filled pills */}
          <div className="pt-2 border-t space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Q&amp;A</span>
            <div className="flex flex-wrap gap-1.5">
              {QA_FILLED_PILLS.map((p) => {
                const count = p.key ? qaCounts[p.key] ?? 0 : undefined;
                const isActive = qaFilled === p.key;
                return (
                  <button
                    key={p.key || 'all'}
                    type="button"
                    onClick={() => onQaFilledChange?.(p.key)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-transparent hover:brightness-95'
                    }`}
                  >
                    {p.label}
                    {count !== undefined && <span className="font-mono">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main table */}
      <Card className="lg:col-span-3">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground italic">
              {isFiltered
                ? 'No candidates match your filters.'
                : 'No candidates ready yet. Score candidates in the Match step first.'}
            </p>
          ) : (
            <>
              <Table className="w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[36px] pl-4">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Candidate</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-center">Score</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Recommendation</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Q&amp;A</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-right pr-4">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const rec = scoreRecommendation(r.overall_score);
                    const isSel = selected.has(r.candidate_id);
                    return (
                      <TableRow key={r.candidate_id} className={isSel ? 'bg-primary/5' : ''}>
                        <TableCell className="pl-4">
                          <Checkbox checked={isSel} onCheckedChange={() => toggle(r.candidate_id)} />
                        </TableCell>
                        <TableCell className="text-xs">{r.applicant_name || `#${r.applicant_id}`}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs font-mono font-bold ${scoreBg(r.overall_score)}`}>{r.overall_score ?? '—'}</Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${rec.tone}`}>{rec.label}</Badge></TableCell>
                        <TableCell>
                          {r.qa_status && QA_BADGE[r.qa_status] ? (
                            <Badge variant="outline" className={`text-[10px] ${QA_BADGE[r.qa_status].className}`}>
                              {QA_BADGE[r.qa_status].label}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="inline-flex items-center gap-1.5">
                            {r.qa_status === 'responded' && (
                              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setQaViewRow(r)}>
                                <MessageSquare className="h-3 w-3" /> Responses
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleView(r)}>
                              <Eye className="h-3 w-3" /> View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t">
                <span className="text-[10px] text-muted-foreground">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-[11px] text-muted-foreground px-1">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>

              <div className="border-t p-3 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selected.size} selected</span>
                  </span>
                  <Button size="sm" className="text-xs" disabled={selected.size === 0 || advancing} onClick={handleAdvanceClick}>
                    {advancing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                    Advance {selected.size} to interview <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Optional reason (applies to all advanced candidates)…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CandidateDetailModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        candidate={viewCandidate}
        jobId={jobId}
      />

      <QaResponseDialog row={qaViewRow} onOpenChange={(o) => { if (!o) setQaViewRow(null); }} />
    </div>
  );
}

// Flattens a saved application-form schema's sections into one field list —
// same shape report-candidate's qa-details.jsx reads, reused here since
// screening_qa already carries both application_form and
// application_form_schema snapshots alongside the Q&A answers.
function flattenFormFields(schema) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  return sections.flatMap((s) => (Array.isArray(s?.fields) ? s.fields : []));
}

function SubmittedApplicationForm({ schema, values }) {
  const fields = flattenFormFields(schema);
  if (fields.length === 0) return null;
  const v = values && typeof values === 'object' ? values : {};
  const display = (f) => {
    const raw = v[f.key];
    if (Array.isArray(raw)) return raw.length ? raw.join(', ') : '—';
    return raw != null && String(raw).trim() !== '' ? String(raw) : '—';
  };
  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <div key={field.key} className="grid grid-cols-[140px_1fr] gap-3 items-start">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">{field.label}</div>
          <div className="text-xs">{display(field)}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Application form + Q&A response preview modal ─────────── */
function QaResponseDialog({ row, onOpenChange }) {
  const [qa, setQa] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row?.screening_id) return;
    let cancelled = false;
    setQa(null);
    setLoading(true);
    getQaResponses(row.screening_id)
      .then((res) => { if (!cancelled) setQa(res.data?.qa || null); })
      .catch((err) => {
        if (cancelled) return;
        toast.error('Failed to load responses', {
          description: err.response?.data?.message || err.message || 'Unknown error',
        });
        onOpenChange(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row?.screening_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const answers = Array.isArray(qa?.answers) ? qa.answers : [];
  const hasForm = flattenFormFields(qa?.application_form_schema).length > 0;

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> {row?.applicant_name || `#${row?.applicant_id}`}'s responses
          </DialogTitle>
          <DialogDescription>Submitted application form &amp; follow-up Q&amp;A answers</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Loading responses…
          </div>
        ) : (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto">
            {hasForm && (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <ClipboardList className="h-3 w-3" /> Submitted application form
                </div>
                <SubmittedApplicationForm schema={qa.application_form_schema} values={qa.application_form} />
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Q&amp;A answers
              </div>
              {answers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No answers on record.</p>
              ) : (
                answers.map((a, i) => (
                  <div key={i} className="text-xs rounded-md bg-muted/20 border p-2.5">
                    <div className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">
                      {a.topic || qa?.questions?.[i]?.topic || `Question ${i + 1}`}
                    </div>
                    <div className="mt-0.5 text-muted-foreground">{a.answer || <em>no answer</em>}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
