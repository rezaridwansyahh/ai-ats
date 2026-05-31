import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Sparkles, Users, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobById } from '@/api/job.api';
import { getJobPipeline } from '@/api/pipeline.api';
import { getMatchingResults } from '@/api/screening.api';
import { getCandidatesByJobId } from '@/api/candidate.api';
import { getStatusPill } from '@/lib/job-display';
import { useDynamicBreadcrumb } from '@/components/layout/breadcrumb-context';

function scoreColor(score) {
  if (score == null) return 'bg-gray-100 text-gray-500';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

// Per-job pipeline detail — reached by clicking a row on /candidate-pipeline.
export default function CandidatePipelineDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState(null);
  const [activeStageId, setActiveStageId] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobLoading(true);
      try {
        const res = await getJobById(id);
        if (!cancelled) setJob(res.data?.job);
      } catch {
        if (!cancelled) setJob(null);
      } finally {
        if (!cancelled) setJobLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStagesLoading(true);
      setStagesError(null);
      try {
        const res = await getJobPipeline(id);
        const raw = res.data?.stages || res.data?.data?.stages || res.data?.data || [];
        const list = Array.isArray(raw) ? raw : [];
        list.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
        if (cancelled) return;
        setStages(list);
        setActiveStageId(list[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) {
          setStagesError(err.response?.data?.message || err.message || 'Failed to load stages');
          setStages([]);
          setActiveStageId(null);
        }
      } finally {
        if (!cancelled) setStagesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Candidates power the stage-count funnel at the top.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCandidatesByJobId(id);
        if (!cancelled) setCandidates(Array.isArray(res.data?.pipelines) ? res.data.pipelines : []);
      } catch {
        if (!cancelled) setCandidates([]);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const activeStage = useMemo(
    () => stages.find((s) => s.id === activeStageId) || null,
    [stages, activeStageId]
  );

  // Funnel: candidate count per stage (+ a "Not started" bucket for candidates
  // with no stage yet).
  const funnel = useMemo(() => {
    const countByStage = {};
    let notStarted = 0;
    for (const c of candidates) {
      if (c.latest_stage == null) notStarted += 1;
      else countByStage[c.latest_stage] = (countByStage[c.latest_stage] || 0) + 1;
    }
    const buckets = [];
    if (notStarted > 0) buckets.push({ key: 'new', label: 'Not started', count: notStarted });
    for (const s of stages) buckets.push({ key: s.id, label: s.name, count: countByStage[s.id] || 0 });
    return buckets;
  }, [stages, candidates]);

  // Surface the job title as the last breadcrumb crumb.
  useDynamicBreadcrumb(job?.job_title);

  return (
    <div className="p-6 space-y-4">
      {/* Top bar */}
      <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/candidate-pipeline')}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Pipeline
      </Button>

      {/* Header */}
      {jobLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading job…
        </div>
      ) : !job ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" /> Job not found.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{job.job_title}</h1>
            {job.status && (
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${getStatusPill(job.status)}`}>
                {job.status}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            {stagesLoading
              ? 'Loading stages…'
              : stages.length === 0
                ? 'No stages configured for this job yet.'
                : `${stages.length} ${stages.length === 1 ? 'stage' : 'stages'} in pipeline`}
          </p>

          {stagesError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {stagesError}
            </div>
          )}

          {/* Stage funnel — count per stage; doubles as the stage navigator */}
          {stagesLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading pipeline stages…
            </div>
          ) : stages.length === 0 ? (
            !stagesError && (
              <p className="text-xs text-muted-foreground italic">
                This job has no stages yet. Configure stages from Job Management.
              </p>
            )
          ) : (
            <Card className="py-5">
              <CardContent>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-center mb-4">
                  Pipeline stages
                </p>
                {/* w-fit + mx-auto centers the row when it fits; scrolls from the left when it overflows */}
                <div className="overflow-x-auto">
                  <div className="flex items-center gap-2 w-fit mx-auto">
                    {funnel.map((b, i) => {
                      const active = b.key === activeStageId;
                      const isNew = b.key === 'new';
                      return (
                        <div key={b.key} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => !isNew && setActiveStageId(b.key)}
                            disabled={isNew}
                            className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 min-w-[104px] transition-all ${
                              active
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                            } ${isNew ? 'cursor-default border-dashed' : 'cursor-pointer'}`}
                          >
                            <span className={`text-2xl font-bold font-mono leading-none ${active ? 'text-primary' : 'text-foreground'}`}>
                              {b.count}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1.5 max-w-[96px] truncate text-center" title={b.label}>
                              {b.label}
                            </span>
                          </button>
                          {i < funnel.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stage content */}
          {activeStage && <StageContent jobId={job.id} stage={activeStage} />}
        </>
      )}
    </div>
  );
}

/* ─── Per-stage content panel ─── */
function StageContent({ jobId, stage }) {
  const isAIMatching = /ai\s*match|screening|matching/i.test(stage.name);
  if (isAIMatching) return <AIMatchingStagePanel jobId={jobId} stage={stage} />;
  return <PlaceholderStagePanel stage={stage} />;
}

function AIMatchingStagePanel({ jobId, stage }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMatchingResults(jobId);
        if (!cancelled) setResults(Array.isArray(res.data?.results) ? res.data.results : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load matching results');
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {stage.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />
            Loading scored candidates…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No AI-matching results yet. Run AI Matching for this job from <span className="font-semibold">Selection → AI Screening</span>.
          </p>
        ) : (
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[28%] text-[10px] font-bold uppercase">Candidate</TableHead>
                <TableHead className="w-[12%] text-[10px] font-bold uppercase text-center">Overall</TableHead>
                <TableHead className="w-[10%] text-[10px] font-bold uppercase text-center">Skills</TableHead>
                <TableHead className="w-[10%] text-[10px] font-bold uppercase text-center">Exp</TableHead>
                <TableHead className="w-[12%] text-[10px] font-bold uppercase text-center">Trajectory</TableHead>
                <TableHead className="w-[10%] text-[10px] font-bold uppercase text-center">Edu</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results
                .slice()
                .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
                .map((r) => (
                  <TableRow key={r.id ?? r.applicant_id}>
                    <TableCell className="text-xs">
                      <div className="font-semibold truncate">
                        {r.applicant_name || `#${r.applicant_id}`}
                      </div>
                      {r.applicant_name && (
                        <div className="text-[10px] text-muted-foreground">#{r.applicant_id}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs font-semibold ${scoreColor(r.overall_score)}`}>
                        {r.overall_score ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs">{r.skills_score ?? '—'}</TableCell>
                    <TableCell className="text-center text-xs">{r.experience_score ?? '—'}</TableCell>
                    <TableCell className="text-center text-xs">{r.career_trajectory_score ?? '—'}</TableCell>
                    <TableCell className="text-center text-xs">{r.education_score ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate">
                      {r.summary || '—'}
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

function PlaceholderStagePanel({ stage }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {stage.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-10 text-center text-xs text-muted-foreground space-y-2">
        <p>Candidate list for this stage isn&apos;t wired up yet.</p>
        <p className="text-[11px]">
          Stage order: {stage.stage_order ?? '—'}
          {stage.stage_type_id && <> · type #{stage.stage_type_id}</>}
        </p>
      </CardContent>
    </Card>
  );
}
