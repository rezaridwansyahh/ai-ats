import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JobsSidebar from '@/components/report/JobsSidebar';
import CandidatesPanel from '@/components/report/CandidatesPanel';
import StepFilterBar from '@/components/report/StepFilterBar';
import { PageHeader } from '@/components/common';
import { getCandidatePipelineSummary, getCandidatesByJobId } from '@/api/candidate.api';

// Real-data Report page.
// - Left rail: GET /candidate-pipeline/summary → [{ job_id, job_title, total }]
// - Right panel: GET /candidate-pipeline/job/:job_id → candidate rows for the selected job
export default function PsychAssesmentPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError]     = useState(null);

  const [selectedJobId, setSelectedJobId] = useState(null);

  const [candidates, setCandidates]       = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError]     = useState(null);

  // Step filter (Setup / Take / Score & Decide) — null = no filter.
  const [activeStep, setActiveStep] = useState(null);

  // Initial summary fetch — also seeds the selected job.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      setJobsError(null);
      try {
        // Added filter 
        const res  = await getCandidatePipelineSummary('Assessment');
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
        // In here categorized assesment so only assesment is shown
        const res = await getCandidatesByJobId(selectedJobId, 'Assessment');
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

  // Pill counts always reflect the full unfiltered list — clicking a pill
  // focuses the candidate list without hiding what's available in other steps.
  const stepCounts = useMemo(() => {
    const c = { setup: 0, take: 0, decide: 0 };
    for (const cand of candidates) {
      if (c[cand.current_step] != null) c[cand.current_step]++;
    }
    return c;
  }, [candidates]);

  const filteredCandidates = useMemo(
    () => (activeStep ? candidates.filter((c) => c.current_step === activeStep) : candidates),
    [candidates, activeStep]
  );

  // Clear the filter when switching jobs so the new job starts unfocused.
  useEffect(() => { setActiveStep(null); }, [selectedJobId]);

  const handleSelectCandidate = (candidate) => {
    navigate(`/selection/psych-assessment/${candidate.job_id}/${candidate.id}`);
  };

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title="Psych"
        highlight="Assessment"
        subtitle="Pick a position to review its candidates and assessment status."
      />

      {jobsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {jobsError}
        </div>
      ) : null}

      <StepFilterBar
        counts={stepCounts}
        activeStep={activeStep}
        onChange={setActiveStep}
      />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <JobsSidebar
          jobs={jobs}
          loading={jobsLoading}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
        <CandidatesPanel
          key={selectedJobId ?? 'none'}
          jobTitle={selectedJob?.job_title ?? '—'}
          candidates={filteredCandidates}
          loading={candidatesLoading}
          error={candidatesError}
          onSelectCandidate={handleSelectCandidate}
        />
      </div>
    </div>
  );
}
