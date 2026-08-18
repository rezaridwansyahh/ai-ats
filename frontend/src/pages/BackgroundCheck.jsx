import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, Loader2, RotateCw, Search, HelpCircle, Settings,
  AlertTriangle, Loader2, RotateCw, Search, HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/common';
import { TablePagination } from '@/components/shared/TablePagination';
import PositionsRail from '@/components/shared/PositionsRail';
import { getInitials } from '@/lib/batteries';

import { getWorkboard, getBgChecksByJob, getBgCheckByCandidate } from '@/api/background-check.api';

import PipelineTour, { usePipelineTour } from '@/components/tours/PipelineTour';
import { BG_CHECK_WORKBOARD_STEPS } from '@/components/tours/tourSteps';

const STATUS_META = {
  claims:  { label: 'Claims',  color: 'bg-blue-100 text-blue-700'     },
  consent: { label: 'Consent', color: 'bg-purple-100 text-purple-700' },
  tracker: { label: 'Tracker', color: 'bg-amber-100 text-amber-700'   },
  verdict: { label: 'Verdict', color: 'bg-orange-100 text-orange-700' },
  done:    { label: 'Ready',   color: 'bg-emerald-100 text-emerald-700' },
};

const CHIP_KEYS = ['claims', 'consent', 'tracker', 'verdict', 'done'];

export default function BackgroundCheckWorkboard() {
  const navigate = useNavigate();

  const [positions, setPositions]   = useState([]);
  const [bgChecks, setBgChecks]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [activeJob, setActiveJob]       = useState('');
  const [activeStatus, setActiveStatus] = useState(null);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  const { run, setRun, markSeen, restart } = usePipelineTour('bg-check-workboard');

  const loadWorkboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const wb  = await getWorkboard();
      const pos = wb.data?.positions || [];
      setPositions(pos);

      const results = await Promise.all(
        pos.map((p) =>
          getBgChecksByJob(p.job_id)
            .then((r) => ({ p, rows: r.data?.bg_checks || [] }))
            .catch(() => ({ p, rows: [] }))
        )
      );

      setBgChecks(
        results.flatMap(({ p, rows }) =>
          rows.map((b) => ({ ...b, job_title: p.job_title, job_id: p.job_id }))
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkboard(); }, []);

  // Compute background check counts per job_id for PositionsRail
  const bgCheckCountsByJob = useMemo(() => {
    const map = {};
    for (const b of bgChecks) {
      const jid = b.job_id;
      if (jid) map[jid] = (map[jid] || 0) + 1;
    }
    return map;
  }, [bgChecks]);

  // Format positions for PositionsRail contract
  const mappedPositions = useMemo(() => {
    return positions.map((p) => ({
      ...p,
      job_id: p.job_id,
      job_title: p.job_title,
      status: p.status,
      total: bgCheckCountsByJob[p.job_id] ?? p.total ?? 0,
    }));
  }, [positions, bgCheckCountsByJob]);

  const statusCounts = useMemo(() => {
    const c = { claims: 0, consent: 0, tracker: 0, verdict: 0, done: 0 };
    for (const b of bgChecks) if (c[b.status] != null) c[b.status]++;
    return c;
  }, [bgChecks]);

  const displayBgChecks = useMemo(() => {
    if (!activeJob) return bgChecks;
    return bgChecks.filter((b) => b.job_id === activeJob.job_id);
  }, [bgChecks, activeJob]);

  const filtered = useMemo(() => {
    let list = displayBgChecks;
    if (activeStatus) list = list.filter((b) => b.status === activeStatus);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((b) =>
        (b.candidate_name || '').toLowerCase().includes(q) ||
        (b.last_position  || '').toLowerCase().includes(q) ||
        (b.job_title      || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayBgChecks, activeStatus, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged       = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  const totalBgChecks   = bgChecks.length;
  const activePositions = positions.filter((p) =>
    ['active', 'open', 'running'].includes((p.status || '').toLowerCase())
  ).length;

  const toggleStatus = (status) => {
    setActiveStatus((cur) => (cur === status ? null : status));
    setPage(1);
  };

  const [openingId, setOpeningId] = useState(null);

  // bg_id can be null if the candidate just arrived at Background Check and
  // no candidate_bg row exists yet (LEFT JOIN in getByJob). Never navigate
  // straight to "/candidate/null" — resolve/create the row first via the
  // by-candidate ensure endpoint, then open with the real bg_id.
  const handleOpenCandidate = async (b) => {
    if (b.bg_id) {
      navigate(`/selection/background-check/candidate/${b.bg_id}`);
      return;
    }
    setOpeningId(b.candidate_id);
    try {
      const res = await getBgCheckByCandidate(b.candidate_id);
      const bgId = res.data?.bg_check?.id;
      if (bgId) navigate(`/selection/background-check/candidate/${bgId}`);
      else setError('Could not open this candidate — no background check record found.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to open candidate');
    } finally {
      setOpeningId(null);
    }
  };

  const resetView = () => { setActiveStatus(null); setSearch(''); setPage(1); setActiveJob(''); };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div data-tour="bgcheck-page-header" className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Background"
          highlight="Check"
          subtitle={`${activePositions} active position${activePositions === 1 ? '' : 's'} · ${totalBgChecks} candidate${totalBgChecks === 1 ? '' : 's'} in background check`}
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={restart}>
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> Take the tour
          </Button>
          <Button variant="outline" size="sm" onClick={loadWorkboard} className="text-xs">
            <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Sub-stage chip strip */}
      <Card data-tour="bgcheck-status-chips">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              By sub-stage · click to filter
            </span>
            {CHIP_KEYS.map((status) => {
              const meta   = STATUS_META[status];
              const count  = statusCounts[status] || 0;
              const active = activeStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
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
            {activeStatus && (
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
        <PositionsRail
          dataTour="bgcheck-positions-rail"
          positions={mappedPositions}
          activeJob={activeJob}
          onSelectJob={handleChangeJob}
          onResetView={resetView}
          totalCount={totalBgChecks}
          loading={loading}
          emptyMessage="No jobs."
        />

        {/* Candidates panel */}
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-sm gap-3 flex items-center h-[40px]">
              {activeJob === '' ? 'All candidates' : activeJob.job_title}
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {filtered.length} {activeStatus ? `at ${STATUS_META[activeStatus].label}` : 'total'}
              </span>
              {activeJob !== '' && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/selection/background-check/job/${activeJob.job_id}`)}>
                  Open Detail
                </Button>
              )}
            </CardTitle>
            <div data-tour="bgcheck-search" className="relative max-w-sm">
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
                <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" /> Loading candidates…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                {bgChecks.length === 0
                  ? 'No candidates in background check yet.'
                  : 'No candidates match this filter.'}
              </div>
            ) : (
              <>
                <div data-tour="bgcheck-candidate-list" className="space-y-2">
                  {paged.map((b) => {
                    const name = b.candidate_name || `#${b.candidate_id}`;
                    const meta = STATUS_META[b.status] || { label: b.status, color: 'bg-muted text-muted-foreground' };
                    return (
                      <div
                        key={b.bg_id ?? `candidate-${b.candidate_id}`}
                        onClick={() => handleOpenCandidate(b)}
                        className={`flex items-center justify-between gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30 cursor-pointer ${
                          openingId === b.candidate_id ? 'opacity-60 pointer-events-none' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{name}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {b.last_position && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {b.last_position}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground truncate">
                                {b.job_title || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {b.verdict && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {b.verdict.replace(/_/g, ' ')}
                            </span>
                          )}
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

      <PipelineTour
        steps={BG_CHECK_WORKBOARD_STEPS}
        tourKey="bg-check-workboard"
        run={run}
        setRun={setRun}
        markSeen={markSeen}
      />
    </div>
  );
}