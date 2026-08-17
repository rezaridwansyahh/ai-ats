import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import CandidatesPanel from '@/components/report/CandidatesPanel';
import StepFilterBar from '@/components/report/StepFilterBar';
import PositionsRail from '@/components/shared/PositionsRail';

import { getCandidatePipelineSummary, getCandidatesByJobId } from '@/api/candidate.api';
import PipelineTour, { usePipelineTour } from '@/components/tours/PipelineTour';
import { PSYCH_ASSESSMENT_STEPS } from '@/components/tours/tourSteps';

export default function PsychAssesmentPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError]     = useState(null);

  // Default to 'all' so it opens with All Candidates view
  const [selectedJobId, setSelectedJobId] = useState('all');

  const [candidates, setCandidates]               = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError]     = useState(null);

  // Step filter (Setup / Take / Score & Decide) — null = no filter.
  const [activeStep, setActiveStep] = useState(null);

  const { run, setRun, markSeen, restart } = usePipelineTour('psych-assessment');

  // Initial summary fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const res  = await getCandidatePipelineSummary('Assessment');
        const list = res.data?.summary || [];
        if (cancelled) return;
        setJobs(list);
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

  // Candidate list fetch — handles both 'all' (fetches all jobs in parallel) and specific job_id
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCandidatesLoading(true);
      setCandidatesError(null);
      try {
        if (selectedJobId === 'all') {
          if (jobs.length === 0) {
            setCandidates([]);
            setCandidatesLoading(false);
            return;
          }
          // Fetch candidates for all available jobs in parallel
          const results = await Promise.all(
            jobs.map((j) =>
              getCandidatesByJobId(j.job_id, 'Assessment')
                .then((r) => r.data?.pipelines || [])
                .catch(() => [])
            )
          );
          if (!cancelled) setCandidates(results.flat());
        } else if (selectedJobId) {
          const res = await getCandidatesByJobId(selectedJobId, 'Assessment');
          if (!cancelled) setCandidates(res.data?.pipelines || []);
        } else {
          setCandidates([]);
        }
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
  }, [selectedJobId, jobs]);

  const selectedJob = useMemo(
    () => (selectedJobId === 'all' ? '' : jobs.find((j) => j.job_id === selectedJobId) || null),
    [jobs, selectedJobId]
  );

  // Map positions array to match the contract expected by PositionsRail
  const mappedPositions = useMemo(() => {
    return jobs.map((j) => ({
      ...j,
      job_id: j.job_id,
      job_title: j.job_title,
      status: j.status || 'active',
      total: j.total ?? 0,
    }));
  }, [jobs]);

  const totalCandidatesAcrossJobs = useMemo(() => {
    return jobs.reduce((acc, j) => acc + (j.total || 0), 0);
  }, [jobs]);

  // Pill counts always reflect the full unfiltered candidate list
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

  // Clear the step filter when switching jobs
  useEffect(() => { setActiveStep(null); }, [selectedJobId]);

  const handleSelectCandidate = (candidate) => {
    navigate(`/selection/psych-assessment/${candidate.job_id}/${candidate.id}`);
  };

  const resetView = () => {
    setSelectedJobId('all');
    setActiveStep(null);
  };

  return (
    <div className="space-y-5 p-6">
      <div data-tour="psych-page-header" className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Psych"
          highlight="Assessment"
          subtitle="Pick a position to review its candidates and assessment status."
        />
        <Button variant="ghost" size="sm" className="text-xs" onClick={restart}>
          <HelpCircle className="h-3.5 w-3.5 mr-1" /> Take the tour
        </Button>
      </div>

      {jobsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {jobsError}
        </div>
      ) : null}

      <div data-tour="psych-step-filter">
        <StepFilterBar
          counts={stepCounts}
          activeStep={activeStep}
          onChange={setActiveStep}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <div data-tour="psych-positions-rail">
          <PositionsRail
            positions={mappedPositions}
            activeJob={selectedJob}
            onSelectJob={(job) => setSelectedJobId(job.job_id)}
            onResetView={resetView}
            totalCount={totalCandidatesAcrossJobs}
            loading={jobsLoading}
            emptyMessage="No positions."
          />
        </div>

        <CandidatesPanel
          key={selectedJobId ?? 'none'}
          jobTitle={selectedJobId === 'all' ? 'All candidates' : (selectedJob?.job_title ?? '—')}
          candidates={filteredCandidates}
          loading={candidatesLoading}
          error={candidatesError}
          onSelectCandidate={handleSelectCandidate}
        />
      </div>

      <PipelineTour 
        steps={PSYCH_ASSESSMENT_STEPS}
        tourKey="psych-assessment"
        run={run}
        setRun={setRun}
        markSeen={markSeen}
      />
    </div>
  );
}