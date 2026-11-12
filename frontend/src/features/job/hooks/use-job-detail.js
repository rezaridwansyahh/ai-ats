import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getJobById } from '../api/job.api';
import { getByJobId as getJobChannels } from '@/api/job-sourcing.api';
import { extractSeekCandidates } from '@/api/job-posting-seek.api';
import { extractLinkedinApplicants } from '@/api/linkedin.api';
import { getPaginatedCandidatesByJobId } from '@/api/candidate.api';

export const CANDIDATES_PAGE_SIZE = 6;

// LinkedIn scrape needs a cap; high ≈ "all current applicants".
const LINKEDIN_SYNC_LIMIT = 100;

// Job Detail's job/channels/candidates fetch + re-sync/poll logic, lifted
// out of the page. `id` is the job id from the route.
export function useJobDetail(id) {
  const [job, setJob] = useState(null);
  const [channels, setChannels] = useState([]);   // core_job_sourcing rows for this job
  const [candidates, setCandidates] = useState([]); // current page of master_candidate rows for this job
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [debouncedCandidateSearch, setDebouncedCandidateSearch] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [debouncedDurationFilter, setDebouncedDurationFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minSalaryInput, setMinSalaryInput] = useState('');
  const [maxSalaryInput, setMaxSalaryInput] = useState('');
  const [debouncedMinSalary, setDebouncedMinSalary] = useState('');
  const [debouncedMaxSalary, setDebouncedMaxSalary] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchJob = useCallback(async () => {
    const res = await getJobById(id);
    setJob(res.data?.job);
  }, [id]);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await getJobChannels(id);
      setChannels(res.data?.postings || []);
    } catch {
      setChannels([]); // no channels / not posted
    }
  }, [id]);

  const fetchCandidates = useCallback(async () => {
    setCandidatesLoading(true);
    try {
      const res = await getPaginatedCandidatesByJobId(id, {
        search: debouncedCandidateSearch || undefined,
        duration_q: debouncedDurationFilter || undefined,
        min_score: minScore > 0 ? minScore : undefined,
        min_salary: debouncedMinSalary !== '' ? debouncedMinSalary : undefined,
        max_salary: debouncedMaxSalary !== '' ? debouncedMaxSalary : undefined,
        page: candidatePage,
        pageSize: CANDIDATES_PAGE_SIZE,
      });
      setCandidates(Array.isArray(res.data?.pipelines) ? res.data.pipelines : []);
      setCandidateTotal(res.data?.total || 0);
    } catch {
      setCandidates([]);
      setCandidateTotal(0);
    } finally {
      setCandidatesLoading(false);
    }
  }, [id, debouncedCandidateSearch, debouncedDurationFilter, minScore, debouncedMinSalary, debouncedMaxSalary, candidatePage]);

  // Job details + posting channels — one-time load, its own loading state.
  // Candidates load separately (below) so searching/paging them doesn't
  // blank out the rest of the page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchJob();
        if (!cancelled) await fetchChannels();
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load job');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchJob, fetchChannels]);

  // Candidates: (re)fetches whenever the search term or page changes.
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // Debounce the live search box before it drives a fetch — this input has
  // no submit button, so without this every keystroke would hit the server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCandidateSearch(candidateSearch), 350);
    return () => clearTimeout(t);
  }, [candidateSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDurationFilter(durationFilter), 350);
    return () => clearTimeout(t);
  }, [durationFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMinSalary(minSalaryInput), 350);
    return () => clearTimeout(t);
  }, [minSalaryInput]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMaxSalary(maxSalaryInput), 350);
    return () => clearTimeout(t);
  }, [maxSalaryInput]);

  // Re-sync re-pulls applicants for each posted platform of this job (1 per platform).
  // Seek is QUEUED — the backend marks the channel sync_state='syncing' and a worker
  // flips it to idle/error; we poll the channels to reflect that. LinkedIn is still
  // synchronous (its queue is a later step). Each extract auto-promotes to candidates.
  const syncableChannels = channels.filter((c) => c.account_id && (c.platform === 'seek' || c.platform === 'linkedin'));
  const anySyncing = channels.some((c) => c.sync_state === 'syncing');
  const wasSyncingRef = useRef(false);

  const handleResync = async () => {
    if (syncing || anySyncing || syncableChannels.length === 0) return;
    setSyncing(true);
    try {
      // Seek: enqueue (returns immediately; backend sets sync_state='syncing').
      for (const ch of syncableChannels.filter((c) => c.platform === 'seek')) {
        await extractSeekCandidates({ account_id: ch.account_id, job_sourcing_id: ch.id });
      }
      await fetchChannels(); // surface the "syncing" badge right away
      // LinkedIn: synchronous for now (no queue/status yet).
      for (const ch of syncableChannels.filter((c) => c.platform === 'linkedin')) {
        try {
          await extractLinkedinApplicants({ account_id: ch.account_id, job_sourcing_id: ch.id, limit: LINKEDIN_SYNC_LIMIT });
        } catch (err) {
          toast.error('LinkedIn sync failed', { description: err.response?.data?.message || err.message });
        }
      }
      await fetchJob();
      await fetchChannels();
    } catch (err) {
      toast.error('Could not start re-sync', { description: err.response?.data?.message || err.message || 'Try again.' });
    } finally {
      setSyncing(false);
    }
  };

  // Poll channels while any Seek channel is syncing; on completion refresh the job
  // (candidate_count) and toast once.
  useEffect(() => {
    if (anySyncing) {
      wasSyncingRef.current = true;
      const t = setTimeout(fetchChannels, 4000);
      return () => clearTimeout(t);
    }
    if (wasSyncingRef.current) {
      wasSyncingRef.current = false;
      fetchJob();
      fetchCandidates();
      if (channels.some((c) => c.sync_state === 'error')) {
        toast.error('Re-sync finished with errors', { description: 'One or more channels failed.' });
      } else {
        toast.success('Re-sync complete', { description: 'Latest applicants pulled and added as candidates.' });
      }
    }
  }, [anySyncing, channels, fetchChannels, fetchJob, fetchCandidates]);

  useEffect(() => {
    setCandidatePage(1);
  }, [debouncedCandidateSearch, debouncedDurationFilter, minScore, debouncedMinSalary, debouncedMaxSalary]);

  // Search/pagination now happen server-side (see fetchCandidates) — `candidates`
  // is already exactly the page that should render.
  const hasActiveCandidateSearch = Boolean(
    debouncedCandidateSearch.trim() || debouncedDurationFilter.trim()
    || minScore > 0 || debouncedMinSalary !== '' || debouncedMaxSalary !== ''
  );
  const candidateTotalPages = Math.max(1, Math.ceil(candidateTotal / CANDIDATES_PAGE_SIZE));

  return {
    job, channels, candidates, candidateTotal, candidatesLoading,
    candidateSearch, setCandidateSearch,
    durationFilter, setDurationFilter,
    minScore, setMinScore,
    minSalaryInput, setMinSalaryInput,
    maxSalaryInput, setMaxSalaryInput,
    candidatePage, setCandidatePage,
    loading, error,
    syncing, anySyncing, syncableChannels,
    handleResync,
    hasActiveCandidateSearch, candidateTotalPages,
  };
}
