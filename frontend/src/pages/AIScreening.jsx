import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Wand2,
  ArrowRight, ArrowLeft, Check, ChevronUp, ChevronDown, ChevronRight,
  FileText, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobById } from '@/api/job.api';
import {
  getCalibration, advanceBulk, getLaneCandidates, getScreeningByCandidate,
} from '@/api/screening.api';

function scoreColor(score) {
  if (score == null) return 'text-muted-foreground';
  if (score >= 80) return 'text-emerald-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-rose-700';
}

function scoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

function recommendation(score) {
  if (score == null) return { label: 'Awaiting score', tone: 'bg-muted text-muted-foreground border-border' };
  if (score >= 90) return { label: 'Strong advance', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 80) return { label: 'Advance',         tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 60) return { label: 'Hold · borderline', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  return                  { label: 'Reject · below threshold', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
}

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
  const [parseRows, setParseRows] = useState([]);
  const [matchRows, setMatchRows] = useState([]);

  // Ready-cohort interaction
  const [selected, setSelected] = useState(new Set());
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortDir, setSortDir] = useState('desc');
  const [reason, setReason] = useState('');
  const [advancing, setAdvancing] = useState(false);

  // Accordion open state — Ready open by default
  const [sectionOpen, setSectionOpen] = useState({ ready: true, match: false, parse: false, qa: false });

  // Refresh just the stage tables (after run / advance)
  const loadStages = useCallback(async () => {
    if (!jobId) return;
    const [calRes, parseRes, matchRes] = await Promise.all([
      getCalibration(jobId),
      getLaneCandidates(jobId, 'parse'),
      getLaneCandidates(jobId, 'match'),
    ]);
    setCohortRows(Array.isArray(calRes.data?.rows) ? calRes.data.rows : []);
    setParseRows(Array.isArray(parseRes.data?.candidates) ? parseRes.data.candidates : []);
    setMatchRows(Array.isArray(matchRes.data?.candidates) ? matchRes.data.candidates : []);
    setSelected(new Set());
  }, [jobId]);

  // Full load on jobId change
  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobRes, calRes, parseRes, matchRes] = await Promise.all([
          getJobById(jobId),
          getCalibration(jobId),
          getLaneCandidates(jobId, 'parse'),
          getLaneCandidates(jobId, 'match'),
        ]);
        if (cancelled) return;

        setJob(jobRes.data?.job || jobRes.data || null);

        setCohortRows(Array.isArray(calRes.data?.rows) ? calRes.data.rows : []);
        setParseRows(Array.isArray(parseRes.data?.candidates) ? parseRes.data.candidates : []);
        setMatchRows(Array.isArray(matchRes.data?.candidates) ? matchRes.data.candidates : []);
        setSelected(new Set());
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load screening');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  // Cohort sort + selection
  const sortedCohort = useMemo(() => {
    const list = [...cohortRows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      const diff = av === bv ? a.screening_id - b.screening_id : (av < bv ? -1 : 1);
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [cohortRows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const allSelected = sortedCohort.length > 0 && sortedCohort.every((r) => selected.has(r.screening_id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(sortedCohort.map((r) => r.screening_id)));
  };

  const toggle = (id) => {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdvance = async () => {
    if (selected.size === 0 || advancing) return;
    setAdvancing(true);
    setError(null);
    setResultBanner(null);
    try {
      const res = await advanceBulk(jobId, [...selected], { decision_reason: reason || undefined });
      const { advanced = [], skipped = [], errors = [], interview_ids = [] } = res.data || {};
      setResultBanner({
        ok: errors.length === 0,
        text: `${advanced.length} advanced · ${skipped.length} skipped · ${errors.length} errors · ${interview_ids.length} interview rows created`,
      });
      setReason('');
      await loadStages();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Advance-bulk failed');
    } finally {
      setAdvancing(false);
    }
  };

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

  const toggleSection = (key) => setSectionOpen((s) => ({ ...s, [key]: !s[key] }));
  const jumpToSection = (key) => {
    setSectionOpen((s) => ({ ...s, [key]: true }));
    setTimeout(() => document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const total_candidates = parseRows.length + matchRows.length + cohortRows.length;
  // Cumulative funnel: everyone past 'parse' has been parsed; everyone in 'ready' has been scored.
  const parsedDone = matchRows.length + cohortRows.length;
  const scoredDone = cohortRows.length;
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
      soon: true, pct: 0,
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
          <span className="text-[11px] text-muted-foreground">{total_candidates} total · Parse → Match → Q&A</span>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {engineTiles.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => jumpToSection(t.key)}
                  className="text-left p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary" /> {t.num} · {t.label}
                    </span>
                    {t.soon
                      ? <span className="text-[9px] uppercase tracking-wider text-muted-foreground">soon</span>
                      : <span className="text-xs font-mono font-bold">
                          {t.done} <span className="font-sans font-normal text-muted-foreground">{t.word}</span>
                        </span>}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${t.pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-muted-foreground">
                    {t.soon ? 'Engine not built yet' : `${t.footer} · see candidates`}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ready to advance */}
      <Card id="section-ready">
        <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('ready')}>
          <CardTitle className="text-sm flex items-center gap-2">
            <ChevronRight className={`h-4 w-4 transition-transform ${sectionOpen.ready ? 'rotate-90' : ''}`} />
            Ready to advance
            <span className="text-[11px] font-normal text-muted-foreground">
              · {cohortRows.length} candidate{cohortRows.length === 1 ? '' : 's'} · select top performers to advance to Interview
            </span>
          </CardTitle>
        </CardHeader>
        {sectionOpen.ready && (
          <CardContent className="px-0 pb-0">
            {cohortRows.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground italic">
                No candidates ready yet. Open a candidate and run AI Matching from their Match panel.
              </p>
            ) : (
              <>
                <Table className="w-full">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[36px] pl-4">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Candidate</TableHead>
                      <SortableHeader label="Fit"        col="overall_score"           sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Skills"     col="skills_score"            sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Exp"        col="experience_score"        sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Trajectory" col="career_trajectory_score" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Edu"        col="education_score"         sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <TableHead className="text-[10px] font-bold uppercase">Recommendation</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase pr-4">Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCohort.map((r) => {
                      const rec = recommendation(r.overall_score);
                      const isSel = selected.has(r.screening_id);
                      return (
                        <TableRow
                          key={r.screening_id}
                          onClick={() => navigate(`/selection/ai-screening/candidate/${r.screening_id}`)}
                          className={`cursor-pointer hover:bg-muted/30 transition-colors ${isSel ? 'bg-primary/5' : ''}`}
                        >
                          <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSel} onCheckedChange={() => toggle(r.screening_id)} />
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {r.last_position || '—'}
                              {r.rubric_is_stale && (
                                <Badge variant="outline" className="ml-1 text-[9px] border-amber-300 text-amber-700">stale</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-xs font-mono font-bold ${scoreBg(r.overall_score)}`}>{r.overall_score ?? '—'}</Badge>
                          </TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.skills_score)}`}>{r.skills_score ?? '—'}</TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.experience_score)}`}>{r.experience_score ?? '—'}</TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.career_trajectory_score)}`}>{r.career_trajectory_score ?? '—'}</TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.education_score)}`}>{r.education_score ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${rec.tone}`}>{rec.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground pr-4 align-top whitespace-normal leading-snug">
                            {r.score_summary || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Advance action bar */}
                <div className="border-t p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{selected.size} selected</span>
                      {' '}· {cohortRows.length} ready · candidates without a decision
                    </div>
                    <Button size="sm" className="text-xs" disabled={selected.size === 0 || advancing} onClick={handleAdvance}>
                      {advancing
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Advancing…</>
                        : <>Advance {selected.size} to Interview <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></>}
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
        )}
      </Card>

      {/* AI Matching lane */}
      <StageSection
        id="section-match"
        title="AI Matching"
        subtitle={`${matchRows.length} parsed · awaiting score`}
        open={sectionOpen.match}
        onToggle={() => toggleSection('match')}
      >
        <LaneTable rows={matchRows} onOpen={openCandidate} />
      </StageSection>

      {/* Resume Parsing lane */}
      <StageSection
        id="section-parse"
        title="Resume Parsing"
        subtitle={`${parseRows.length} in queue`}
        open={sectionOpen.parse}
        onToggle={() => toggleSection('parse')}
      >
        <LaneTable rows={parseRows} onOpen={openCandidate} />
      </StageSection>

      {/* Follow-up Q&A (engine not built) */}
      <StageSection
        id="section-qa"
        title="Follow-up Q&A"
        subtitle="coming soon"
        open={sectionOpen.qa}
        onToggle={() => toggleSection('qa')}
      >
        <p className="py-8 text-center text-xs text-muted-foreground italic">
          Q&A engine arrives in a future release. Borderline candidates (60–82 fit) will receive 3–5 follow-up questions here.
        </p>
      </StageSection>
    </div>
  );
}

function StageSection({ id, title, subtitle, open, onToggle, children }) {
  return (
    <Card id={id}>
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <CardTitle className="text-sm flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
          {title}
          {subtitle && <span className="text-[11px] font-normal text-muted-foreground">· {subtitle}</span>}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="px-0 pb-0">{children}</CardContent>}
    </Card>
  );
}

function LaneTable({ rows, onOpen }) {
  if (!rows || rows.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground italic">No candidates in this stage.</p>;
  }
  return (
    <Table className="w-full">
      <TableHeader className="bg-muted/40">
        <TableRow>
          <TableHead className="text-[10px] font-bold uppercase pl-4">Candidate</TableHead>
          <TableHead className="text-[10px] font-bold uppercase">Last position</TableHead>
          <TableHead className="text-[10px] font-bold uppercase">Location</TableHead>
          <TableHead className="text-[10px] font-bold uppercase text-right pr-4">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.applicant_id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => onOpen(r)}>
            <TableCell className="text-xs pl-4">
              <div className="font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
              <div className="text-[10px] text-muted-foreground">#{r.applicant_id}</div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{r.last_position || '—'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{r.address || '—'}</TableCell>
            <TableCell className="text-right text-xs font-mono pr-4">{r.overall_score ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortableHeader({ label, col, sortKey, sortDir, onClick, className }) {
  const active = sortKey === col;
  return (
    <TableHead
      className={`text-[10px] font-bold uppercase cursor-pointer select-none ${className || ''}`}
      onClick={() => onClick(col)}
    >
      <span className="inline-flex items-center gap-1 justify-center">
        {label}
        {active && (sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
      </span>
    </TableHead>
  );
}
