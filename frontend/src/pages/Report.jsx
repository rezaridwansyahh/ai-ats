import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JobsSidebar from '@/components/report/JobsSidebar';
import CandidatesPanel from '@/components/report/CandidatesPanel';
import { getCandidatePipelineSummary, getCandidatesByJobId } from '@/api/candidate.api';

// Real-data Report page.
// - Left rail: GET /candidate-pipeline/summary → [{ job_id, job_title, total }]
// - Right panel: GET /candidate-pipeline/job/:job_id → candidate rows for the selected job
export default function ReportPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError]     = useState(null);

  const [selectedJobId, setSelectedJobId] = useState(null);

  const [candidates, setCandidates]       = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError]     = useState(null);

  // Initial summary fetch — also seeds the selected job.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const res  = await getCandidatePipelineSummary();
        const list = res.data?.summary || [];
        if (cancelled) return;
        setJobs(list);
        if (list.length > 0) setSelectedJobId(list[0].job_id);
      } catch (err) {
        if (!cancelled) {
          setJobsError(err.response?.data?.message || err.message || 'Failed to load jobs');
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Candidate list fetch — runs whenever the selected job changes.
  useEffect(() => {
    if (selectedJobId == null || selectedJobId === 'all') {
      setCandidates([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setCandidatesLoading(true);
      setCandidatesError(null);
      try {
        const res = await getCandidatesByJobId(selectedJobId);
        if (!cancelled) setCandidates(res.data?.pipelines || []);
      } catch (err) {
        if (!cancelled) {
          setCandidatesError(err.response?.data?.message || err.message || 'Failed to load candidates');
          setCandidates([]);
        }
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.job_id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const handleSelectCandidate = (candidate) => {
    navigate(`/selection/report/${candidate.job_id}/${candidate.id}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Report</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pick a position to review its candidates and assessment status.
        </p>
      </div>

      {jobsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {jobsError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <JobsSidebar
          jobs={jobs}
          loading={jobsLoading}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
        <CandidatesPanel
          jobTitle={selectedJob?.job_title ?? '—'}
          candidates={candidates}
          loading={candidatesLoading}
          error={candidatesError}
          onSelectCandidate={handleSelectCandidate}
        />
      </div>
    </div>
  );
}
