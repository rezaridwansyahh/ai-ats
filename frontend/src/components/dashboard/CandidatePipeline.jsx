import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase, ChevronLeft, ChevronRight, Check, Loader2, AlertTriangle,
  Sparkles, Users, MapPin, Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobs } from '@/api/job.api';
import { getJobPipeline } from '@/api/pipeline.api';
import { getMatchingResults } from '@/api/screening.api';

const STEPS = [
  { key: 'select',     label: 'Select Job' },
  { key: 'conclusion', label: 'Conclusion' },
];

function scoreColor(score) {
  if (score == null) return 'bg-gray-100 text-gray-500';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

export default function CandidatePipeline() {
  const [activeStep, setActiveStep] = useState(0);

  // Step 01 — Select Job
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      try {
        const res = await getJobs();
        const list = res.data?.jobs || res.data || [];
        if (!cancelled) setJobs(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Step 02 — Conclusion
  const [stages, setStages] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stagesError, setStagesError] = useState(null);
  const [activeStageId, setActiveStageId] = useState(null);

  // Reset stage state when entering step 2 with a different job.
  useEffect(() => {
    if (activeStep !== 1 || !selectedJobId) return;
    let cancelled = false;
    (async () => {
      setStagesLoading(true);
      setStagesError(null);
      try {
        const res = await getJobPipeline(selectedJobId);
        // Backends in this codebase tend to return either { stages: [...] } or
        // { data: { stages: [...] } } — accept both.
        const raw = res.data?.stages || res.data?.data?.stages || res.data?.data || [];
        const list = Array.isArray(raw) ? raw : [];
        if (cancelled) return;
        // Sort defensively in case backend ordering changes.
        list.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
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
  }, [activeStep, selectedJobId]);

  const handleNext = () => {
    if (activeStep === 0 && !selectedJobId) return;
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const handlePrev = () => setActiveStep((s) => Math.max(s - 1, 0));

  const activeStage = useMemo(
    () => stages.find((s) => s.id === activeStageId) || null,
    [stages, activeStageId]
  );

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 py-2 border-b">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-1 py-1 transition-all ${
              i === activeStep ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < activeStep
                  ? 'bg-primary text-white'
                  : i === activeStep
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < activeStep ? <Check className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, '0')}
              </div>
              <span className={`text-[11px] font-bold transition-colors ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 ${i < activeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step navigation */}
      <div className="flex justify-between items-center -mt-2 pb-2 border-b">
        {activeStep > 0 ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous: {STEPS[activeStep - 1].label}
          </Button>
        ) : <div />}
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={activeStep === 0 && !selectedJobId}
            onClick={handleNext}
          >
            Next: {STEPS[activeStep + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>

      {/* Step content */}
      {activeStep === 0 && (
        <SelectJobStep
          jobs={jobs}
          jobsLoading={jobsLoading}
          selectedJob={selectedJob}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
      )}
      {activeStep === 1 && (
        <ConclusionStep
          selectedJob={selectedJob}
          stages={stages}
          stagesLoading={stagesLoading}
          stagesError={stagesError}
          activeStage={activeStage}
          activeStageId={activeStageId}
          onSelectStage={setActiveStageId}
        />
      )}
    </div>
  );
}

/* ───────────────────── Step 01 ───────────────────── */
function SelectJobStep({ jobs, jobsLoading, selectedJob, selectedJobId, onSelectJob }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Select a job to view its candidate pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedJobId ? String(selectedJobId) : ''}
          onValueChange={(v) => onSelectJob(Number(v))}
          disabled={jobsLoading}
        >
          <SelectTrigger className="w-full max-w-md text-xs">
            <SelectValue placeholder={jobsLoading ? 'Loading jobs...' : 'Choose a job'} />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={String(j.id)}>
                {j.job_title} {j.status ? `· ${j.status}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedJob && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-2 max-w-md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate">{selectedJob.job_title}</h3>
                <p className="text-[10px] text-muted-foreground">Job #{selectedJob.id}</p>
              </div>
              {selectedJob.status && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {selectedJob.status}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              {selectedJob.job_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedJob.job_location}
                </span>
              )}
              {selectedJob.work_type && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {selectedJob.work_type}
                </span>
              )}
              {selectedJob.seniority_level && (
                <span>{selectedJob.seniority_level}</span>
              )}
            </div>
          </div>
        )}

        {!jobsLoading && jobs.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No jobs available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ───────────────────── Step 02 ───────────────────── */
function ConclusionStep({
  selectedJob, stages, stagesLoading, stagesError,
  activeStage, activeStageId, onSelectStage,
}) {
  if (!selectedJob) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          No job selected. Go back to step 01.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: which job, summary stage count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold">{selectedJob.job_title}</h3>
          <p className="text-[11px] text-muted-foreground">
            {stagesLoading
              ? 'Loading stages…'
              : stages.length === 0
                ? 'No stages configured for this job yet.'
                : `${stages.length} ${stages.length === 1 ? 'stage' : 'stages'} in pipeline`}
          </p>
        </div>
      </div>

      {/* Horizontal stage buttons */}
      {stagesError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {stagesError}
        </div>
      )}

      {stagesLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading pipeline stages…
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stages.map((s) => {
            const active = s.id === activeStageId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStage(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {s.name}
              </button>
            );
          })}
          {stages.length === 0 && !stagesError && (
            <p className="text-xs text-muted-foreground italic">
              This job has no stages yet. Configure stages from Job Management.
            </p>
          )}
        </div>
      )}

      {/* Stage content */}
      {activeStage && (
        <StageContent jobId={selectedJob.id} stage={activeStage} />
      )}
    </div>
  );
}

/* ─── Per-stage content panel ─── */
function StageContent({ jobId, stage }) {
  const isAIMatching = /ai\s*match|screening|matching/i.test(stage.name);

  if (isAIMatching) {
    return <AIMatchingStagePanel jobId={jobId} stage={stage} />;
  }

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
            No AI-matching results yet. Run AI Matching for this job from <span className="font-semibold">Selection → AI Matching</span>.
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
        <p>Candidate list for this stage isn't wired up yet.</p>
        <p className="text-[11px]">
          Stage order: {stage.stage_order ?? '—'}
          {stage.stage_type_id && <> · type #{stage.stage_type_id}</>}
        </p>
      </CardContent>
    </Card>
  );
}
