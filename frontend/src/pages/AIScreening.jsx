import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Wand2,
  ArrowLeft, Check,
  FileText, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { getJobById } from '@/api/job.api';
import {
  getCalibration, advanceBulk, getLaneCandidates, getEngineCounts,
} from '@/api/screening.api';

import ParseStageDashboard from '@/components/ai-screening/ParseStageDashboard';
import MatchStageDashboard from '@/components/ai-screening/MatchStageDashboard';
import QAStageDashboard from '@/components/ai-screening/QAStageDashboard';
import PipelineStageDashboard from '@/components/ai-screening/PipelineStageDashboard';

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

export default function AIScreeningPage() {
  const navigate = useNavigate();
  const { jobId: jobIdParam } = useParams();
  const jobId = jobIdParam ? Number(jobIdParam) : null;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultBanner, setResultBanner] = useState(null);

  // Summary-tile counts — fetched eagerly, independent of which tab is open
  // (see getEngineCounts' comment on the backend for why this is split out
  // from the full per-lane rows below).
  const [counts, setCounts] = useState({ parse: 0, match: 0, qa: 0, ready: 0, qa_responded: 0 });

  // Full per-lane candidate rows — fetched lazily, exactly one API call per
  // stage tab. A tab's own lane endpoint already returns whatever adjacent-
  // bucket data that tab's dashboard needs (e.g. 'match' returns both its
  // own pending queue AND the already-scored 'qa' bucket as a reference) —
  // shaped server-side (see getCandidatesByJobAndEngine) so this stays a
  // single round trip instead of the tab firing a second request itself.
  const [cohortRows, setCohortRows] = useState([]);
  const [parseRows, setParseRows]   = useState([]);
  const [matchRows, setMatchRows]   = useState([]);
  const [qaRows, setQaRows]         = useState([]);
  const [qaRespondedRows, setQaRespondedRows] = useState([]);
  const [loadedLanes, setLoadedLanes] = useState(() => new Set());
  const [laneLoading, setLaneLoading] = useState(false);

  const [advancing, setAdvancing] = useState(false);

  // Accordion open state — Parse open by default
  const [activeStage, setActiveStage] = useState('parse');

  const fetchLane = useCallback(async (lane) => {
    if (lane === 'ready') {
      const res = await getCalibration(jobId);
      setCohortRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
      return;
    }
    const res = await getLaneCandidates(jobId, lane);
    const data = res.data?.candidates || {};
    if (lane === 'parse') {
      setParseRows(Array.isArray(data.pending) ? data.pending : []);
    } else if (lane === 'match') {
      setMatchRows(Array.isArray(data.pending) ? data.pending : []);
      setQaRows(Array.isArray(data.scored) ? data.scored : []);
    } else if (lane === 'qa') {
      setQaRows(Array.isArray(data.pending) ? data.pending : []);
      setQaRespondedRows(Array.isArray(data.responded) ? data.responded : []);
    }
  }, [jobId]);

  // Fetches a stage tab's own lane if it isn't already cached — exactly one
  // call. `force` bypasses the cache (used after an action changes the data).
  const ensureStageLoaded = useCallback(async (stage, { force = false } = {}) => {
    if (!jobId) return;
    if (!force && loadedLanes.has(stage)) return;
    setLaneLoading(true);
    try {
      await fetchLane(stage);
      setLoadedLanes((prev) => new Set([...prev, stage]));
    } finally {
      setLaneLoading(false);
    }
  }, [jobId, loadedLanes, fetchLane]);

  // Refresh after an action that changes the data (advance, (re)score). The
  // job row + summary counts always refresh; the per-lane rows are dropped
  // from the cache entirely (not just the current tab's) so any tab visited
  // afterward re-fetches fresh instead of showing stale pre-action rows.
  const refreshAfterAction = useCallback(async () => {
    if (!jobId) return;
    const [jobRes, countsRes] = await Promise.all([getJobById(jobId), getEngineCounts(jobId)]);
    setJob(jobRes.data?.job || jobRes.data || null);
    setCounts(countsRes.data?.counts || {});
    setLoadedLanes(new Set());
    await ensureStageLoaded(activeStage, { force: true });
  }, [jobId, activeStage, ensureStageLoaded]);

  // Initial load on jobId change — job + counts eagerly, then whichever
  // lanes the currently-active stage needs.
  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobRes, countsRes] = await Promise.all([getJobById(jobId), getEngineCounts(jobId)]);
        if (cancelled) return;
        setJob(jobRes.data?.job || jobRes.data || null);
        setCounts(countsRes.data?.counts || {});
        setLoadedLanes(new Set());
        await ensureStageLoaded(activeStage, { force: true });
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load screening');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on jobId change; tab switches are handled by the effect below
  }, [jobId]);

  // Tab switches after the initial mount — fetch whatever the newly-active
  // stage needs that isn't already cached. Skips the very first render,
  // which the effect above already handles.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    if (!jobId) return;
    ensureStageLoaded(activeStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the tab actually changing
  }, [activeStage]);

  // Lazy-create screening row if missing, then open candidate detail
  const openCandidate = async (row) => {
    try {
      navigate(`/selection/ai-screening/candidate/${row.candidate_id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to open candidate');
    }
  };

  // Sourced from the eagerly-fetched counts, not the (possibly not-yet-loaded)
  // row arrays — these need to render correctly before any tab's full data
  // has been fetched. Matches the exact same definitions the row-based
  // version used: parsedDone = match+qa counts, scoredDone = qa count,
  // qaDone = qa_responded count, total = ready count.
  const total_candidates = counts.ready ?? 0;
  const parsedDone = (counts.match ?? 0) + (counts.qa ?? 0);
  const scoredDone = counts.qa ?? 0;
  const qaDone     = counts.qa_responded ?? 0;
  const pctOf = (n) => (total_candidates > 0 ? Math.round((n / total_candidates) * 100) : 0);

  const engineTiles = [
    {
      key: 'parse', num: 1, label: 'Resume Parsing', icon: FileText,
      done: parsedDone, word: 'parsed', pct: pctOf(parsedDone),
      footer: `${parsedDone} parsed · ${counts.parse ?? 0} pending`,
    },
    {
      key: 'match', num: 2, label: 'AI Matching', icon: Wand2,
      done: scoredDone, word: 'scored', pct: pctOf(scoredDone),
      footer: `${scoredDone} scored · ${counts.match ?? 0} pending`,
    },
    {
      key: 'qa', num: 3, label: 'Follow-up Q&A', icon: MessageSquare,
      done: qaDone, word: 'responded', pct: pctOf(qaDone),
      footer: `${qaDone} responded · ${counts.qa ?? 0} in progress`,
    },
    {
      key: 'ready', num: 4, label: 'Ready to Advance', icon: Check,
      done: total_candidates, word: 'ready', pct: pctOf(total_candidates),
      footer: `${total_candidates} awaiting decision`,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Back + header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/selection/ai-screening')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to workboard
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{job?.job_title || `Job #${jobId}`}</h1>
            {job?.status && (
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wide ${statusTone(job.status)}`}>
                {job.status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total_candidates} candidate{total_candidates === 1 ? '' : 's'} being screened
            {job?.job_location ? ` · ${job.job_location}` : ''}
            {job?.work_type ? ` · ${job.work_type}` : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resultBanner && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
          resultBanner.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          <Check className="h-4 w-4 shrink-0" />
          {resultBanner.text}
        </div>
      )}

      {/* Engine progress */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Engine progress
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">{total_candidates} total · Parse → Match → Q&A → Advance</span>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {engineTiles.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveStage(t.key)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    activeStage === t.key
                      ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30'
                      : 'bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary" /> {t.num} · {t.label}
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {t.done} <span className="font-sans font-normal text-muted-foreground">{t.word}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${t.pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-muted-foreground">
                    {t.footer} · see candidates
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage detail — a spinner while this tab's lane data is still being
          lazily fetched, so switching tabs doesn't blank the whole page. */}
      {laneLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeStage === 'parse' && (
            <ParseStageDashboard
              pendingRows={parseRows}
              parsedCount={parsedDone}
              onOpen={openCandidate}
            />
          )}

          {activeStage === 'match' && (
            <MatchStageDashboard
              jobId={jobId}
              job={job}
              pendingRows={matchRows}
              scoredRows={[...qaRows]}
              onOpen={openCandidate}
              onScored={refreshAfterAction}
            />
          )}

          {activeStage === 'qa' && (
            <QAStageDashboard
              pendingRows={qaRows}
              respondedRows={qaRespondedRows}
              undecidedCount={total_candidates}
              onOpen={openCandidate}
            />
          )}

          {activeStage === 'ready' && (
            <PipelineStageDashboard
              rows={cohortRows}
              advancing={advancing}
              onAdvance={async (ids, reasonText) => {
                setAdvancing(true);
                setError(null);
                setResultBanner(null);
                try {
                  const res = await advanceBulk(jobId, ids, { decision_reason: reasonText });
                  const { advanced = [], skipped = [], errors = [], interview_ids = [] } = res.data || {};
                  setResultBanner({
                    ok: errors.length === 0,
                    text: `${advanced.length} advanced · ${skipped.length} skipped · ${errors.length} errors · ${interview_ids.length} interview rows created`,
                  });
                  await refreshAfterAction();
                  return { advanced, skipped, errors, interview_ids };
                } catch (err) {
                  setError(err.response?.data?.message || err.message || 'Advance-bulk failed');
                  return { advanced: [], skipped: [], errors: [{ message: 'request failed' }], interview_ids: [] };
                } finally {
                  setAdvancing(false);
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}