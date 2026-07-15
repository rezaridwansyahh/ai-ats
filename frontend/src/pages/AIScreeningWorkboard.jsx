import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, Loader2, RotateCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/shared/TablePagination';
import { getInitials } from '@/lib/batteries';

import { getWorkboard, getLaneCandidates } from '@/api/screening.api';

import { PageHeader } from '@/components/common';

// Sub-stage chip + pill styling. q&a kept for parity (engine not built → always 0).
const STAGE_META = {
  parse: { label: 'Parse', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  match: { label: 'Match', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  qa:    { label: 'Q&A',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

function statusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'open':
    case 'running':
      return 'border-emerald-200 text-emerald-700 bg-emerald-50';
    case 'draft':
      return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'expired':
    case 'failed':
      return 'border-rose-200 text-rose-700 bg-rose-50';
    default:
      return 'border-border text-muted-foreground bg-muted/40';
  }
}

export default function AIScreeningWorkboard() {
  const navigate = useNavigate();

  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeJob, setActiveJob] = useState('');
  const [activeStage, setActiveStage] = useState(null); // null = all stages
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadWorkboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const wb = await getWorkboard();
      const pos = wb.data?.positions || [];
      setPositions(pos);
      // No cross-job candidate endpoint — fan out per position and tag with job_title.
      const laneResults = await Promise.all(
        pos.map((p) =>
          getLaneCandidates(p.job_id)
            .then((r) => ({ p, rows: r.data?.candidates || [] }))
            .catch(() => ({ p, rows: [] }))
        )
      );
      setCandidates(
        laneResults.flatMap(({ p, rows }) =>
          rows.map((c) => ({ ...c, job_title: p.job_title }))
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workboard');
    } finally {
      setLoading(false);
    }
  };

  const displayCandidates = useMemo(() => {
    if (activeJob === '') return candidates;
    return candidates.filter(c => c.job_id === activeJob.job_id);
  }, [candidates, activeJob]);

  useEffect(() => { loadWorkboard(); }, []);

  // Stage counts derived from the candidate list so chips match the filter exactly.
  const stageCounts = useMemo(() => {
    const c = { parse: 0, match: 0, qa: 0, ready: 0 };
    for (const cand of candidates) if (c[cand.engine] != null) c[cand.engine]++;
    return c;
  }, [candidates]);

  const filtered = useMemo(() => {
    let list = displayCandidates;
    if (activeStage) list = list.filter((c) => c.engine === activeStage);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        (c.applicant_name || '').toLowerCase().includes(q) ||
        (c.last_position || '').toLowerCase().includes(q) ||
        (c.job_title || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayCandidates , activeStage, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  const totalCandidates = candidates.length;
  const activePositions = positions.filter((p) =>
    ['active', 'open', 'running'].includes((p.status || '').toLowerCase())
  ).length;

  const toggleStage = (stage) => {
    setActiveStage((cur) => (cur === stage ? null : stage));
    setPage(1);
  };

  const resetView = () => { setActiveStage(null); setSearch(''); setPage(1); setActiveJob(''); };

  const openCandidate = async (c) => {
    try {
      navigate(`/selection/ai-screening/candidate/${c.candidate_id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to open candidate');
    }
  };

  const handleChangeJob = (position) => setActiveJob(position)

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Screening
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activePositions} active position{activePositions === 1 ? '' : 's'} · {totalCandidates} candidate{totalCandidates === 1 ? '' : 's'} being screened
          </p>
        </div> */}
        <PageHeader
          title="AI"
          highlight="Screening"
          subtitle={`${activePositions} active position${activePositions === 1 ? '' : 's'} · ${totalCandidates} candidate${totalCandidates === 1 ? '' : 's'} being screened`}
        />
        <Button variant="outline" size="sm" onClick={loadWorkboard} className="text-xs">
          <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Sub-stage chip strip */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              By sub-stage · click to filter
            </span>
            {['parse', 'match', 'qa', 'ready'].map((stage) => {
              const meta = STAGE_META[stage];
              const count = stageCounts[stage] || 0;
              const active = activeStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleStage(stage)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : `${meta.color} border-transparent hover:brightness-95 cursor-pointer`
                  }`}
                >
                  <span className="font-mono">{count}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
            {activeStage && (
              <Button variant="ghost" size="sm" onClick={resetView} className="text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column: positions rail + candidates panel */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        {/* Positions rail */}
        <Card className="self-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Positions · {positions.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-2 pb-2">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : positions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-2 py-3">No jobs.</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={resetView}
                  className={[
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold",
                    (activeJob === "")
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 text-foreground'
                  ].join(" ")}
                >
                  <span>All positions</span>
                  <span className="font-mono text-[10px]">{totalCandidates}</span>
                </button>
                <div className="space-y-0.5 mt-1">
                  {positions.map((p) => (
                    <button
                      key={p.job_id}
                      type="button"
                      onClick={() => handleChangeJob(p)}
                      className={[
                        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs",
                        (activeJob.job_id === p.job_id)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/60 text-foreground',
                      ].join(" ")}
                    >
                      <span className="truncate text-left flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{p.job_title}</span>
                        {p.status && (
                          <Badge variant="outline" className={`text-[8px] uppercase tracking-wide shrink-0 ${statusTone(p.status)}`}>
                            {p.status}
                          </Badge>
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{p.total}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Candidates panel */}
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-sm gap-3 flex items-center h-[40px]">
              {activeJob === '' ? "All candidates" : `${activeJob.job_title}`}
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {filtered.length} {activeStage ? `at ${STAGE_META[activeStage].label}` : 'total'}
              </span>
              {activeJob !== '' && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/selection/ai-screening/job/${activeJob.job_id}`)}>
                  Open Detail
                </Button>
              )}
            </CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name, position, or job…"
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />Loading candidates…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                {candidates.length === 0 ? 'No candidates in screening yet.' : 'No candidates match this filter.'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paged.map((c) => {
                    const name = c.applicant_name || `#${c.applicant_id}`;
                    const meta = STAGE_META[c.engine] || { label: c.engine, color: 'bg-muted text-muted-foreground' };
                    return (
                      <div
                        key={c.screening_id ?? `${c.job_id}-${c.candidate_id}`}
                        onClick={() => openCandidate(c)}
                        className="flex items-center justify-between gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{name}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {c.last_position && <span className="text-[10px] text-muted-foreground truncate">{c.last_position}</span>}
                              <span className="text-[10px] text-muted-foreground truncate">{c.job_title || '—'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3">
                  <TablePagination
                    page={pageClamped}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
