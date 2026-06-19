import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getJobById } from '@/api/job.api';
import { getJobPipeline } from '@/api/pipeline.api';
import { getCandidatesByJobId } from '@/api/candidate.api';
import { useDynamicBreadcrumb } from '@/components/layout/breadcrumb-context';

import KanbanBoard, { JobContextBar } from '@/components/dashboard/KanbanBoard';

export default function CandidatePipelineDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob]               = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [stages, setStages]         = useState([]);
  const [candidates, setCandidates] = useState([]);

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

  // ── Load candidates ──
  
useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const res = await getCandidatesByJobId(id);
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

      if (!cancelled) setCandidates(mapped);
    } catch {
      if (!cancelled) setCandidates([]);
    }
  })();
  return () => { cancelled = true; };
}, [id, job]);

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
    <div className="p-6 space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs -ml-2"
        onClick={() => navigate('/candidate-pipeline')}
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
        Back to Pipeline
      </Button>

      <JobContextBar job={kanbanJob} />

      <KanbanBoard
        job={kanbanJob}
        stages={stages}
        candidates={candidates}
        onSelectCandidate={handleSelectCandidate}
      />
    </div>
  );
}