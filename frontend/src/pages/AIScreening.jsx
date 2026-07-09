import { useState, useEffect, useMemo, useCallback } from 'react';
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
  getCalibration, advanceBulk, getLaneCandidates, getScreeningByCandidate,
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

  // Stage data
  const [cohortRows, setCohortRows] = useState([]);
  const [parseRows, setParseRows]   = useState([]);
  const [matchRows, setMatchRows]   = useState([]);
  const [qaRows, setQaRows]         = useState([]);

  const [advancing, setAdvancing] = useState(false);

  // Accordion open state — Parse open by default
  const [activeStage, setActiveStage] = useState('parse');

  // Refresh just the stage tables (after run / advance)
  const loadStages = useCallback(async () => {
    if (!jobId) return;
    const [calRes, parseRes, matchRes, qaRes] = await Promise.all([
      getCalibration(jobId),
      getLaneCandidates(jobId, 'parse'),
      getLaneCandidates(jobId, 'match'),
      getLaneCandidates(jobId, 'qa'),
    ]);
    setCohortRows(Array.isArray(calRes.data?.rows)           ? calRes.data.rows           : []);
    setParseRows(Array.isArray(parseRes.data?.candidates)   ? parseRes.data.candidates   : []);
    setMatchRows(Array.isArray(matchRes.data?.candidates)   ? matchRes.data.candidates   : []);
    setQaRows(Array.isArray(qaRes.data?.candidates)         ? qaRes.data.candidates      : []);
  }, [jobId]);

  // Full load on jobId change
  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobRes, calRes, parseRes, matchRes, qaRes] = await Promise.all([
          getJobById(jobId),
          getCalibration(jobId),
          getLaneCandidates(jobId, 'parse'),
          getLaneCandidates(jobId, 'match'),
          getLaneCandidates(jobId, 'qa'),
        ]);
        if (cancelled) return;

        setJob(jobRes.data?.job || jobRes.data || null);

        setCohortRows(Array.isArray(calRes.data?.rows)         ? calRes.data.rows         : []);
        setParseRows(Array.isArray(parseRes.data?.candidates)  ? parseRes.data.candidates : []);
        setMatchRows(Array.isArray(matchRes.data?.candidates)  ? matchRes.data.candidates : []);
        setQaRows(Array.isArray(qaRes.data?.candidates)        ? qaRes.data.candidates    : []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load screening');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  // Lazy-create screening row if missing, then open candidate detail
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

  const total_candidates = parseRows.length + matchRows.length + qaRows.length + cohortRows.length;
  const parsedDone = matchRows.length + qaRows.length + cohortRows.length;
  const scoredDone = qaRows.length + cohortRows.length;
  const qaDone     = cohortRows.length;
  const pctOf = (n) => (total_candidates > 0 ? Math.round((n / total_candidates) * 100) : 0);

  const engineTiles = [
    {
      key: 'parse', num: 1, label: 'Resume Parsing', icon: FileText,
      done: parsedDone, word: 'parsed', pct: pctOf(parsedDone),
      footer: `${parsedDone} parsed · ${parseRows.length} pending`,
    },
    {
      key: 'match', num: 2, label: 'AI Matching', icon: Wand2,
      done: scoredDone, word: 'scored', pct: pctOf(scoredDone),
      footer: `${scoredDone} scored · ${matchRows.length} pending`,
    },
    {
      key: 'qa', num: 3, label: 'Follow-up Q&A', icon: MessageSquare,
      done: qaDone, word: 'responded', pct: pctOf(qaDone),
      footer: `${qaDone} responded · ${qaRows.length} in progress`,
    },
    {
      key: 'ready', num: 4, label: 'Ready to Advance', icon: Check,
      done: cohortRows.length, word: 'ready', pct: pctOf(cohortRows.length),
      footer: `${cohortRows.length} awaiting decision`,
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

      {/* Stage detail */}
      {activeStage === 'parse' && (
        <ParseStageDashboard
          pendingRows={parseRows}
          parsedRows={[...matchRows, ...qaRows, ...cohortRows]}
          onOpen={openCandidate}
        />
      )}

      {activeStage === 'match' && (
        <MatchStageDashboard
          jobId={jobId}
          pendingRows={matchRows}
          scoredRows={[...qaRows, ...cohortRows]}
          onOpen={openCandidate}
          onScored={loadStages}
        />
      )}

      {activeStage === 'qa' && (
        <QAStageDashboard
          pendingRows={qaRows}
          respondedRows={cohortRows}
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
              await loadStages();
            } catch (err) {
              setError(err.response?.data?.message || err.message || 'Advance-bulk failed');
            } finally {
              setAdvancing(false);
            }
          }}
        />
      )}
    </div>
  );
}