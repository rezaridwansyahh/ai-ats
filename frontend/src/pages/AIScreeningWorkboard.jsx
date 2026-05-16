import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, AlertTriangle, Loader2, Briefcase, ArrowRight,
  CircleAlert, Hourglass, CheckCircle2, RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

import {
  getWorkboard, getLaneCandidates, matchBulk, getScreeningByCandidate,
} from '@/api/screening.api';

const ENGINE_META = {
  parse: { label: 'Parse',    color: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  match: { label: 'Match',    color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  qa:    { label: 'Q&A',      color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
  ready: { label: 'Ready',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

export default function AIScreeningWorkboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active chip filter (null = show needs-attention feed by default)
  const [activeChip, setActiveChip] = useState(null);
  // Position rail selection (null = all positions)
  const [activeJobId, setActiveJobId] = useState(null);

  // Lane list state (loaded when a chip is active)
  const [laneRows, setLaneRows] = useState([]);
  const [laneLoading, setLaneLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  const loadWorkboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWorkboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkboard(); }, []);

  // When chip + job change, load lane candidates from the chosen job
  useEffect(() => {
    if (!activeChip || !activeJobId) { setLaneRows([]); setSelected(new Set()); return; }
    if (activeChip === 'qa') { setLaneRows([]); return; } // Q&A engine not built
    let cancelled = false;
    (async () => {
      setLaneLoading(true);
      try {
        const res = await getLaneCandidates(activeJobId, activeChip);
        if (!cancelled) {
          setLaneRows(res.data?.candidates || []);
          setSelected(new Set());
        }
      } catch {
        if (!cancelled) setLaneRows([]);
      } finally {
        if (!cancelled) setLaneLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeChip, activeJobId]);

  const counts = data?.counts || { parse: 0, match: 0, qa: 0, ready: 0 };
  const positions = data?.positions || [];
  const attention = data?.attention || {
    ready_per_job: [], needs_parsing_per_job: [], needs_matching_per_job: [], stale_rubric: [],
  };

  const toggleChip = (chip) => {
    setActiveChip((cur) => (cur === chip ? null : chip));
    if (!activeJobId && positions.length > 0) {
      // Auto-pick the first job with rows in that lane.
      const target = positions.find((p) => (p[chip] || 0) > 0);
      if (target) setActiveJobId(target.job_id);
    }
  };

  const toggleSelected = (id) => {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allLaneIds = useMemo(() => laneRows.map((r) => r.applicant_id), [laneRows]);
  const allSelected = allLaneIds.length > 0 && allLaneIds.every((id) => selected.has(id));
  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(allLaneIds));
  };

  // Lazy-creates the screening row if missing, then navigates to L3.
  const openCandidate = async (row) => {
    try {
      if (row.screening_id) {
        navigate(`/selection/ai-screening/candidate/${row.screening_id}`);
        return;
      }
      const res = await getScreeningByCandidate(row.candidate_id);
      const sid = res.data?.screening?.screening_id;
      if (sid) navigate(`/selection/ai-screening/candidate/${sid}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to open candidate');
    }
  };

  const handleBulkMatch = async () => {
    if (selected.size === 0 || !activeJobId) return;
    setBulkRunning(true);
    try {
      await matchBulk(activeJobId, [...selected]);
      await loadWorkboard();
      // refresh lane
      const res = await getLaneCandidates(activeJobId, activeChip);
      setLaneRows(res.data?.candidates || []);
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Match-bulk failed');
    } finally {
      setBulkRunning(false);
    }
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Screening
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Workboard across all jobs — pick a lane, multi-select, bulk-action. Or jump into a single job for the full rubric flow.
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

      {/* Chip strip */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              By engine
            </span>
            {['parse', 'match', 'qa', 'ready'].map((chip) => {
              const meta = ENGINE_META[chip];
              const count = counts[chip] || 0;
              const active = activeChip === chip;
              const disabled = chip === 'qa';
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => !disabled && toggleChip(chip)}
                  disabled={disabled}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : disabled
                        ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60'
                        : `${meta.color} hover:brightness-95 cursor-pointer`
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary-foreground' : meta.dot}`} />
                  <span className="font-mono">{count}</span>
                  <span>{meta.label}</span>
                  {disabled && <span className="text-[9px] uppercase tracking-wider ml-1 opacity-70">soon</span>}
                </button>
              );
            })}
            {activeChip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveChip(null)}
                className="text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column grid: position rail + main pane */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        {/* Position rail */}
        <Card>
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
                  onClick={() => setActiveJobId(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                    activeJobId === null
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <span>All positions</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {positions.reduce((a, p) => a + p.total, 0)}
                  </span>
                </button>
                <div className="space-y-0.5 mt-1">
                  {positions.map((p) => (
                    <button
                      key={p.job_id}
                      type="button"
                      onClick={() => setActiveJobId(p.job_id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                        activeJobId === p.job_id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span className="truncate text-left">{p.job_title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground ml-2">{p.total}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Main pane: lane list OR attention feed */}
        <div className="space-y-3">
          {activeChip && activeJobId ? (
            <LanePanel
              chip={activeChip}
              jobTitle={positions.find((p) => p.job_id === activeJobId)?.job_title}
              rows={laneRows}
              loading={laneLoading}
              selected={selected}
              allSelected={allSelected}
              onToggle={toggleSelected}
              onToggleAll={toggleSelectAll}
              onBulkMatch={handleBulkMatch}
              bulkRunning={bulkRunning}
              onOpenJob={() => navigate(`/selection/ai-screening/job/${activeJobId}`)}
              onOpenCandidate={openCandidate}
              onCalibrate={() => navigate(`/selection/ai-screening/job/${activeJobId}/calibrate`)}
            />
          ) : (
            <AttentionFeed
              attention={attention}
              loading={loading}
              onOpenJob={(jobId) => navigate(`/selection/ai-screening/job/${jobId}`)}
              onCalibrate={(jobId) => navigate(`/selection/ai-screening/job/${jobId}/calibrate`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Lane panel: list of candidates at one engine for one job ─── */
function LanePanel({
  chip, jobTitle, rows, loading, selected, allSelected,
  onToggle, onToggleAll, onBulkMatch, bulkRunning, onOpenJob, onOpenCandidate, onCalibrate,
}) {
  const meta = ENGINE_META[chip];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            {meta.label} lane · <span className="text-muted-foreground font-normal">{jobTitle || '—'}</span>
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {rows.length} candidate{rows.length === 1 ? '' : 's'} · select multiple to act in bulk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={onOpenJob}>
            Open job <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          {chip === 'match' && (
            <Button
              size="sm"
              className="text-xs"
              disabled={selected.size === 0 || bulkRunning}
              onClick={onBulkMatch}
            >
              {bulkRunning
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Scoring…</>
                : `Score ${selected.size} selected`}
            </Button>
          )}
          {chip === 'parse' && (
            <Button size="sm" className="text-xs" disabled title="Parse bulk arrives in Phase 2.5">
              Parse {selected.size} selected
            </Button>
          )}
          {chip === 'ready' && (
            <Button size="sm" className="text-xs" onClick={onCalibrate}>
              Calibrate cohort <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 italic">
            No candidates in this lane for this job.
          </p>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[36px]">
                  <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Candidate</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Last position</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Location</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.applicant_id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onOpenCandidate?.(r)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(r.applicant_id)}
                      onCheckedChange={() => onToggle(r.applicant_id)}
                    />
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
                    <div className="text-[10px] text-muted-foreground">#{r.applicant_id}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">
                    {r.last_position || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">
                    {r.address || '—'}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {r.overall_score ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Needs-attention feed (default L1 view) ─── */
function AttentionFeed({ attention, loading, onOpenJob, onCalibrate }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const blockers = (attention.stale_rubric || []).slice(0, 5);
  const ready    = attention.ready_per_job || [];
  const parse    = attention.needs_parsing_per_job || [];
  const match    = attention.needs_matching_per_job || [];
  const empty = blockers.length === 0 && ready.length === 0 && parse.length === 0 && match.length === 0;

  if (empty) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
          Nothing needs your attention right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {blockers.length > 0 && (
        <AttentionSection
          title="Blockers"
          icon={<CircleAlert className="h-4 w-4 text-red-600" />}
          accent="border-red-200 bg-red-50/40"
        >
          {blockers.map((b) => (
            <button
              key={`${b.applicant_id}-${b.job_id}`}
              type="button"
              onClick={() => onOpenJob(b.job_id)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-white/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">
                  {b.applicant_name || `#${b.applicant_id}`} · stale rubric
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {b.job_title} · scored {fmtDate(b.scored_at)}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-red-200 text-red-700">
                rescore needed
              </Badge>
            </button>
          ))}
        </AttentionSection>
      )}

      {ready.length > 0 && (
        <AttentionSection
          title="Ready for you"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          accent="border-emerald-200 bg-emerald-50/40"
        >
          {ready.map((r) => (
            <button
              key={r.job_id}
              type="button"
              onClick={() => onCalibrate(r.job_id)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-white/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">
                  {r.count} candidate{r.count === 1 ? '' : 's'} ready to advance
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{r.job_title}</div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-200 text-emerald-700">
                calibrate →
              </Badge>
            </button>
          ))}
        </AttentionSection>
      )}

      {(parse.length > 0 || match.length > 0) && (
        <AttentionSection
          title="Backlog"
          icon={<Hourglass className="h-4 w-4 text-amber-600" />}
          accent="border-amber-200 bg-amber-50/40"
        >
          {parse.map((p) => (
            <button
              key={`parse-${p.job_id}`}
              type="button"
              onClick={() => onOpenJob(p.job_id)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-white/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{p.count} need parsing</div>
                <div className="text-[10px] text-muted-foreground truncate">{p.job_title}</div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-amber-200 text-amber-700">parse</Badge>
            </button>
          ))}
          {match.map((m) => (
            <button
              key={`match-${m.job_id}`}
              type="button"
              onClick={() => onOpenJob(m.job_id)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-white/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{m.count} need matching</div>
                <div className="text-[10px] text-muted-foreground truncate">{m.job_title}</div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-amber-200 text-amber-700">match</Badge>
            </button>
          ))}
        </AttentionSection>
      )}
    </>
  );
}

function AttentionSection({ title, icon, accent, children }) {
  return (
    <Card className={`border ${accent || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-2 pb-2 space-y-0.5">
        {children}
      </CardContent>
    </Card>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return '—'; }
}
