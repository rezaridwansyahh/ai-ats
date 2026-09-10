import { useEffect, useMemo, useState } from 'react';
import {
  ChevronUp, ChevronDown, Loader2, PlayCircle, ArrowRight, Eye, MapPin, CalendarDays,
  Check, X, Minus, Search, Info
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
import { TablePagination } from '@/components/shared/TablePagination';
import { Slider } from '@/components/ui/slider';
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

/** Helper to extract standardized preference items from application_qa */
function parsePreferences(information) {
  if (!information) return [];
  if (Array.isArray(information)) {
    return information.map((item) => ({
      question: item.question || item.label || '—',
      answer: item.answer || item.value || '—',
      meets_requirement: item.meets_requirement ?? item.is_match ?? true,
    }));
  }
  if (typeof information === 'object') {
    return Object.entries(information).map(([question, v]) => ({
      question,
      answer: typeof v === 'object' ? v?.answer || '—' : String(v),
      meets_requirement: typeof v === 'object' ? v?.meets_requirement : true,
    }));
  }
  return [];
}

export default function MatchStageDashboard({ jobId, pendingRows = [], scoredRows = [], onOpen, onScored }) {
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortDir, setSortDir] = useState('desc');
  const [running, setRunning] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [advancing, setAdvancing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // FILTERS
  const [locationFilter, setLocationFilter] = useState('all');
  const [appliedWithin, setAppliedWithin] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [skillFilters, setSkillFilters] = useState(() => new Set());
  const [filterKeyword, setFilterKeyword] = useState('');
  
  // NEW: Must-have toggle & preference checkboxes filter
  const [mustHaveOnly, setMustHaveOnly] = useState(false);
  const [preferenceFilters, setPreferenceFilters] = useState(() => new Set());
  const [preferenceAccordionOpen, setPreferenceAccordionOpen] = useState(true);

  // Collect location counts
  const locationCounts = useMemo(() => {
    const counts = {};
    for (const r of scoredRows) {
      if (!r.address) continue;
      counts[r.address] = (counts[r.address] || 0) + 1;
    }
    return counts;
  }, [scoredRows]);
  const uniqueLocations = useMemo(() => Object.keys(locationCounts), [locationCounts]);

  // Collect skill counts
  const skillCounts = useMemo(() => {
    const counts = {};
    for (const r of scoredRows) {
      const matched = Array.isArray(r.matched_skills) ? r.matched_skills : [];
      for (const s of matched) counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [scoredRows]);

  const uniqueSkills = useMemo(
    () => Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]),
    [skillCounts]
  );

  // Collect unique preference questions & count candidates matching each preference
  const preferenceCounts = useMemo(() => {
    const counts = {};
    for (const r of scoredRows) {
      const prefs = parsePreferences(r.application_qa);
      for (const p of prefs) {
        if (p.meets_requirement) {
          counts[p.question] = (counts[p.question] || 0) + 1;
        } else if (!(p.question in counts)) {
          counts[p.question] = 0;
        }
      }
    }
    return counts;
  }, [scoredRows]);

  const uniquePreferences = useMemo(() => Object.keys(preferenceCounts), [preferenceCounts]);

  const toggleSkillFilter = (skill) => {
    setSkillFilters((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill); else next.add(skill);
      return next;
    });
  };

  const togglePreferenceFilter = (prefQuestion) => {
    setPreferenceFilters((prev) => {
      const next = new Set(prev);
      if (next.has(prefQuestion)) next.delete(prefQuestion); else next.add(prefQuestion);
      return next;
    });
  };

  const resetFilters = () => {
    setLocationFilter('all');
    setAppliedWithin('all');
    setMinScore(0);
    setSkillFilters(new Set());
    setFilterKeyword('');
    setMustHaveOnly(false);
    setPreferenceFilters(new Set());
  };

  const filteredRows = useMemo(() => {
    const kw = filterKeyword.trim().toLowerCase();
    return scoredRows.filter((r) => {
      if (kw) {
        const hay = `${r.applicant_name || ''} ${r.last_position || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (locationFilter !== 'all' && r.address !== locationFilter) return false;
      if ((r.overall_score ?? 0) < minScore) return false;
      if (skillFilters.size > 0) {
        const matched = Array.isArray(r.matched_skills) ? r.matched_skills : [];
        if (![...skillFilters].every((s) => matched.includes(s))) return false;
      }
      if (appliedWithin !== 'all' && r.applied_at) {
        const days = Number(appliedWithin);
        const diffDays = (Date.now() - new Date(r.applied_at).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > days) return false;
      }

      const prefs = parsePreferences(r.application_qa);

      // Must-have filter: Candidate must meet 100% of preferences (e.g., 8/8)
      if (mustHaveOnly && prefs.length > 0) {
        const allMatched = prefs.every((p) => p.meets_requirement === true);
        if (!allMatched) return false;
      }

      // Individual preference checkboxes filter
      if (preferenceFilters.size > 0) {
        const matchesAllSelectedPrefs = [...preferenceFilters].every((qKey) => {
          const matchItem = prefs.find((p) => p.question === qKey);
          return matchItem && matchItem.meets_requirement === true;
        });
        if (!matchesAllSelectedPrefs) return false;
      }

      return true;
    });
  }, [scoredRows, filterKeyword, locationFilter, minScore, skillFilters, appliedWithin, mustHaveOnly, preferenceFilters]);

  const sorted = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      if (av === bv) return 0;
      const diff = av < bv ? -1 : 1;
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [filteredRows, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [jobId, sortKey, sortDir, scoredRows.length, filterKeyword, locationFilter, appliedWithin, minScore, skillFilters, mustHaveOnly, preferenceFilters]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = sorted.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

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
          description: `${scored}/${total} scored · ${errors.length} failed.`,
        });
      } else {
        toast.success('Bulk scoring complete', {
          description: `${scored} of ${total} candidates scored.`,
        });
      }
      await onScored?.();
    } catch (err) {
      toast.error('Bulk scoring failed', {
        description: err.response?.data?.message || err.message || 'Unknown error',
      });
    } finally {
      setRunning(false);
    }
  };

  const isFiltered = filterKeyword || locationFilter !== 'all' || appliedWithin !== 'all' || minScore > 0 || skillFilters.size > 0 || mustHaveOnly || preferenceFilters.size > 0;

  return (
    <div className="space-y-4 p-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
        {/* Left Sidebar Filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Awaiting Score" value={pendingRows.length} />
            <StatCard label="Scored" value={scoredRows.length} />
            <StatCard label="Top score" value={scoredRows.length ? topScore : '—'} />
            <StatCard label="Avg score" value={scoredRows.length ? avgScore : '—'} />
          </div>

          {scoredRows.length > 0 && (
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
                      placeholder="Name or last position…"
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                      className="h-7 w-full rounded-md border border-input bg-transparent pl-7 pr-2 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* MUST-HAVE FILTER TOGGLE (image_ef4702 style) */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="must-have-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                      <Checkbox
                        id="must-have-toggle"
                        checked={mustHaveOnly}
                        onCheckedChange={(v) => setMustHaveOnly(!!v)}
                      />
                      <span>Terapkan filter "persyaratan harus dimiliki"</span>
                    </label>
                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" title="Kandidat harus memenuhi 100% kecocokan preferensi" />
                  </div>
                </div>

                {/* PREFERENCES / SCREENING QUESTIONS FILTER ACCORDION */}
                {uniquePreferences.length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <button
                      type="button"
                      onClick={() => setPreferenceAccordionOpen((o) => !o)}
                      className="flex items-center justify-between w-full text-xs font-medium hover:text-primary"
                    >
                      <span>Pertanyaan untuk kandidat</span>
                      {preferenceAccordionOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {preferenceAccordionOpen && (
                      <div className="space-y-2 pl-1 pt-1">
                        {uniquePreferences.map((qKey) => {
                          const isChecked = preferenceFilters.has(qKey);
                          const count = preferenceCounts[qKey] || 0;
                          return (
                            <div key={qKey} className="flex items-center justify-between gap-2">
                              <label className="flex items-start gap-2 text-[11px] cursor-pointer text-muted-foreground hover:text-foreground leading-tight">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePreferenceFilter(qKey)}
                                  className="mt-0.5 shrink-0"
                                />
                                <span className="break-words">{qKey}</span>
                              </label>
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Location Filter */}
                <div className="pt-2 border-t space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Location</span>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-7 w-full text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All locations</SelectItem>
                      {uniqueLocations.map((loc) => (
                        <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Applied Filter */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Applied</span>
                  <Select value={appliedWithin} onValueChange={setAppliedWithin}>
                    <SelectTrigger className="h-7 w-full text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Any time</SelectItem>
                      <SelectItem value="7" className="text-xs">Last 7 days</SelectItem>
                      <SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
                      <SelectItem value="90" className="text-xs">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Fit Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Min. Fit</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{minScore}+</span>
                  </div>
                  <Slider value={[minScore]} min={0} max={100} step={5} onValueChange={([v]) => setMinScore(v)} />
                </div>

                {/* Skill Badges Filter */}
                {uniqueSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueSkills.slice(0, 12).map((skill) => {
                        const active = skillFilters.has(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkillFilter(skill)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted text-muted-foreground border-transparent hover:brightness-95'
                            }`}
                          >
                            {skill} ({skillCounts[skill]})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Ranking Table / Candidate Cards */}
        <Card className="lg:col-span-3">
          <CardContent className="space-y-3 pt-6">
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground italic">
                {scoredRows.length === 0 ? 'No candidates scored yet.' : 'No candidates match your filters.'}
              </p>
            ) : (
              <>
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

                <div className="space-y-2.5">
                  {paged.map((r) => (
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

                <TablePagination
                  page={pageClamped}
                  totalPages={totalPages}
                  totalItems={sorted.length}
                  pageSize={pageSize}
                  setPage={setPage}
                  setPageSize={setPageSize}
                />
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
  console.log("Candidate row data:", r);
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

/** Component for rendering Candidate Preference Matches (image_ef46e6 style) */
function PreferenceMatch({ information }) {
  const [open, setOpen] = useState(true);
  const preferences = parsePreferences(information);
  const matchCount = preferences.filter((p) => p.meets_requirement === true).length;

  return (
    <div className="pt-2 border-t">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] font-medium hover:text-primary"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Kecocokan preferensi ({matchCount}/{preferences.length} cocok)
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {preferences.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No screening questions recorded.</p>
          ) : (
            preferences.map((p, idx) => {
              const meets = p.meets_requirement;
              const Icon = meets === true ? Check : meets === false ? X : Minus;
              const iconCls = meets === true ? 'text-emerald-600' : meets === false ? 'text-rose-600' : 'text-muted-foreground';
              return (
                <div key={idx} className="grid grid-cols-[10px_180px_1fr] gap-2 text-[11px]">
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground break-words">{p.question}</span>
                  <span className="flex items-center gap-1 font-medium break-words">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${iconCls}`} />
                    {p.answer}
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