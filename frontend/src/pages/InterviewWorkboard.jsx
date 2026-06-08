import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, AlertTriangle, Loader2, RotateCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/shared/TablePagination';
import { getInitials } from '@/lib/batteries';

import { getWorkboard, getInterviewsByJob, getInterviewByCandidate } from '@/api/interview.api';

const STATUS_META = {
  ongoing:   { label: 'Ongoing',   color: 'bg-blue-100 text-blue-700'      },
  scheduled: { label: 'Scheduled', color: 'bg-violet-100 text-violet-700'  },
  done:      { label: 'Done',      color: 'bg-emerald-100 text-emerald-700' },
};

function jobStatusTone(status) {
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

export default function InterviewWorkboard() {
  const navigate = useNavigate();

  const [positions, setPositions]   = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [activeStatus, setActiveStatus] = useState(null);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  const loadWorkboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const wb  = await getWorkboard();
      const pos = wb.data?.positions || [];
      setPositions(pos);

      const results = await Promise.all(
        pos.map((p) =>
          getInterviewsByJob(p.job_id)
            .then((r) => ({ p, rows: r.data?.interviews || [] }))
            .catch(() => ({ p, rows: [] }))
        )
      );
      setInterviews(
        results.flatMap(({ p, rows }) =>
          rows.map((i) => ({ ...i, job_title: p.job_title }))
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkboard(); }, []);

  const statusCounts = useMemo(() => {
    const c = { ongoing: 0, scheduled: 0, done: 0 };
    for (const i of interviews) if (c[i.status] != null) c[i.status]++;
    return c;
  }, [interviews]);

  const filtered = useMemo(() => {
    let list = interviews;
    if (activeStatus) list = list.filter((i) => i.status === activeStatus);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i) =>
        (i.candidate_name || '').toLowerCase().includes(q) ||
        (i.last_position  || '').toLowerCase().includes(q) ||
        (i.job_title      || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [interviews, activeStatus, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged       = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  const totalInterviews = interviews.length;
  const activePositions = positions.filter((p) =>
    ['active', 'open', 'running'].includes((p.status || '').toLowerCase())
  ).length;

  const toggleStatus = (status) => {
    setActiveStatus((cur) => (cur === status ? null : status));
    setPage(1);
  };

  const resetView = () => { setActiveStatus(null); setSearch(''); setPage(1); };

  const openInterview = async (i) => {
    try {
      if (i.interview_id) {
        navigate(`/selection/interview/candidate/${i.interview_id}`);
        return;
      }
      const res = await getInterviewByCandidate(i.candidate_id);
      const iid = res.data?.interview?.interview_id;
      if (iid) navigate(`/selection/interview/candidate/${iid}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to open interview');
    }
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Interview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activePositions} active position{activePositions === 1 ? '' : 's'} · {totalInterviews} candidate{totalInterviews === 1 ? '' : 's'} in interview
          </p>
        </div>
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

      {/* Status chip strip */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              By status · click to filter
            </span>
            {['ongoing', 'scheduled', 'done'].map((status) => {
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

      {/* Two-column layout */}
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs bg-primary/10 text-primary font-semibold"
                >
                  <span>All positions</span>
                  <span className="font-mono text-[10px]">{totalInterviews}</span>
                </button>
                <div className="space-y-0.5 mt-1">
                  {positions.map((p) => (
                    <button
                      key={p.job_id}
                      type="button"
                      onClick={() => navigate(`/selection/interview/job/${p.job_id}`)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs hover:bg-muted/50 text-foreground transition-colors"
                    >
                      <span className="truncate text-left flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{p.job_title}</span>
                        {p.status && (
                          <Badge
                            variant="outline"
                            className={`text-[8px] uppercase tracking-wide shrink-0 ${jobStatusTone(p.status)}`}
                          >
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

        {/* Interviews panel */}
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-sm">
              All candidates
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {filtered.length} {activeStatus ? `at ${STATUS_META[activeStatus]?.label}` : 'total'}
              </span>
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
                <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />Loading interviews…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                {interviews.length === 0
                  ? 'No candidates in interview yet.'
                  : 'No candidates match this filter.'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paged.map((i) => {
                    const name = i.candidate_name || `#${i.candidate_id}`;
                    const meta = STATUS_META[i.status] || { label: i.status, color: 'bg-muted text-muted-foreground' };
                    return (
                      <div
                        key={`${i.job_id}-${i.candidate_id}-${i.round_number}`}
                        onClick={() => openInterview(i)}
                        className="flex items-center justify-between gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{name}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {i.last_position && (
                                <span className="text-[10px] text-muted-foreground truncate">{i.last_position}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground truncate">{i.job_title || '—'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {i.round_number && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              R{i.round_number}
                            </span>
                          )}
                          {i.scheduled_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(i.scheduled_at).toLocaleDateString()}
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
    </div>
  );
}