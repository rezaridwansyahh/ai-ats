import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Building2, MapPin, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getJobById } from '@/api/job.api';
import { getJobPipeline } from '@/api/pipeline.api';
import { getPaginatedCandidatesByJobId, getJobPipelineCounts } from '@/api/candidate.api';
import { useDynamicBreadcrumb } from '@/components/layout/breadcrumb-context';
import { StatusBadge } from '@/components/common';

import PipelineTable from '@/components/dashboard/PipelineTable';
import { EXPERIENCE_BUCKETS, ROWS_PER_PAGE } from '@/components/dashboard/pipelineTableConstants';

import PipelineTour, { usePipelineTour } from '@/components/tours/PipelineTour';
import { PIPELINE_DETAIL_STEPS } from '@/components/tours/tourSteps';

export default function CandidatePipelineDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob]               = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [stages, setStages]         = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal]           = useState(0);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [summary, setSummary]       = useState({ totalInPipeline: 0, totalHired: 0 });

  // Table filter/sort/page state — lives here now since it drives the
  // server-side fetch below instead of filtering an already-loaded list.
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [expFilter, setExpFilter]     = useState('all');
  const [sortDir, setSortDir]         = useState(null);
  const [page, setPage]               = useState(1);

  const { run, setRun, markSeen, restart } = usePipelineTour('pipeline-detail');

  // ── Load job ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobLoading(true);
      try {
        const res = await getJobById(id);
        if (!cancelled) setJob(res.data?.job ?? null);
      } catch {
        if (!cancelled) setJob(null);
      } finally {
        if (!cancelled) setJobLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Load pipeline stages ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getJobPipeline(id);
        const raw  = res.data?.stages ?? res.data?.data?.stages ?? res.data?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        list.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
        if (!cancelled) setStages(list);
      } catch {
        if (!cancelled) setStages([]);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Header summary (total in pipeline / total hired) — independent of
  //    whatever filter/page the table below is showing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getJobPipelineCounts(id);
        if (!cancelled) {
          setSummary({
            totalInPipeline: res.data?.counts?.total ?? 0,
            totalHired: res.data?.counts?.total_hired ?? 0,
          });
        }
      } catch {
        // header summary is a nicety, not required for the table to work
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Debounce the live search box before it drives a fetch — this input has
  // no submit button, so without this every keystroke would hit the server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change resets back to page 1.
  useEffect(() => { setPage(1); }, [debouncedSearch, stageFilter, expFilter, sortDir]);

  // ── Load candidates (paginated + filtered) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCandidatesLoading(true);
      try {
        const bucket = EXPERIENCE_BUCKETS.find((b) => b.id === expFilter);
        const res = await getPaginatedCandidatesByJobId(id, {
          search: debouncedSearch || undefined,
          stage_id: stageFilter !== 'all' ? stageFilter : undefined,
          min_exp: bucket ? bucket.min : undefined,
          max_exp: bucket && bucket.max !== Infinity ? bucket.max : undefined,
          sort: sortDir === 'desc' ? 'exp_desc' : sortDir === 'asc' ? 'exp_asc' : undefined,
          page,
          pageSize: ROWS_PER_PAGE,
        });
        if (!cancelled) {
          const list = Array.isArray(res.data?.pipelines) ? res.data.pipelines : [];
          const mapped = list.map((c) => ({
            id: c.id,
            applicant_id: c.id,
            name: c.candidate_name,
            role: c.information?.job_position?.current ?? c.last_position,
            experience: c.information?.experience?.years_total
              ? `${c.information.experience.years_total}y`
              : '—',
            skills: c.information?.skills ?? [],
            stage_id: c.latest_stage,
            // give all candidates the same "city" so they group into one section
            city_id: job?.job_title ?? 'all',
            city_name: job?.job_title ?? 'Candidates',
          }));
          setCandidates(mapped);
          setTotal(res.data?.total || 0);
        }
      } catch {
        if (!cancelled) { setCandidates([]); setTotal(0); }
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, job, debouncedSearch, stageFilter, expFilter, sortDir, page]);

  useDynamicBreadcrumb(job?.job_title);

  const kanbanJob = job ? {
    id:        job.id,
    title:     job.job_title,
    headcount: job.headcount ?? job.target_hire ?? 0,
    status:    job.status,
    deadline:  job.deadline  ?? null,
    days_open: job.days_open ?? null,
    cities:    [],
  } : null;

  const hasActiveFilters = Boolean(search.trim()) || stageFilter !== 'all' || expFilter !== 'all';

  const handleSelectCandidate = (candidate) => {
    navigate(`/candidate-detail/${candidate.id}`);
  };

  if (jobLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading job…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          Job not found.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sticky header — mirrors JobDetailPage's pattern.
          -mt-5 -mx-5 px-5 cancels <main>'s p-5 so it pins flush under the breadcrumb. */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            data-tour="back-to-pipeline"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/candidate-pipeline')}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Pipeline
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={restart}>
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> Take the tour
          </Button>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{job.job_title}</h1>
            <StatusBadge
              label={job.status}
              variant={
                job.status === 'Active'  ? 'success' :
                job.status === 'Expired' ? 'danger'  :
                job.status === 'Blocked' ? 'danger'  : 'muted'
              }
              dot
            />
          </div>
          <div data-tour="job-summary" className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {job.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {job.company}</span>}
            {job.job_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.job_location}</span>}
            <span className="font-mono">
              HIRED <span className="font-bold text-foreground">{summary.totalHired}</span>
              <span className="text-muted-foreground">/{kanbanJob?.headcount ?? 0}</span>
            </span>
            <span>· {summary.totalInPipeline} in pipeline</span>
            {job.deadline && <span>· deadline {job.deadline}</span>}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <PipelineTable
          job={kanbanJob}
          stages={stages}
          candidates={candidates}
          total={total}
          loading={candidatesLoading}
          hasActiveFilters={hasActiveFilters}
          search={search}
          onSearchChange={setSearch}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          expFilter={expFilter}
          onExpFilterChange={setExpFilter}
          sortDir={sortDir}
          onSortToggle={setSortDir}
          page={page}
          onPageChange={setPage}
          onSelectCandidate={handleSelectCandidate}
        />
      </div>

      <PipelineTour
        steps={PIPELINE_DETAIL_STEPS}
        tourKey="pipeline-detail"
        run={run}
        setRun={setRun}
        markSeen={markSeen}
      />
    </>
  );
}
