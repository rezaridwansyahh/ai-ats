import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJobs, deleteJob } from '../api/job.api';

// Job Management's list/stats/delete logic, lifted out of the page.
export function useJobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      setJobs(res.data.jobs || []);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    await fetchJobs();
  };

  const stats = useMemo(() => {
    const totalApplicants = jobs.reduce((sum, j) => sum + (j.candidate_count ?? 0), 0);
    const jobsPosted = jobs.length;
    const openJobs = jobs.filter(j => j.status === 'Active' || j.status === 'Running').length;
    const draftJobs = jobs.filter(j => j.status === 'Draft').length;
    return { totalApplicants, jobsPosted, openJobs, draftJobs };
  }, [jobs]);

  return { jobs, loading, stats, fetchJobs, handleDeleteJob };
}
