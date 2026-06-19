
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, deleteJob } from '@/api/job.api';
import JobCreation from '@/components/job-management/JobCreation';
import { PageHeader } from '@/components/common';

// Phase 1 of the JobManagement revamp: this page is now just the list surface.
// The 4-step wizard (Creation → Stages → Posting → List Source) is replaced by
// the single-page JobEdit.jsx at /sourcing/job-management/new and :id/edit.
// Active jobs route to JobDetail.jsx at /sourcing/job-management/:id.
export default function JobManagementPage() {
  const navigate = useNavigate();
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

  // Draft → edit form, anything else → detail page.
  const handleSelectJob = (job) => {
    if (!job) return;
    const dest = job.status === 'Draft'
      ? `/sourcing/job-management/${job.id}/edit`
      : `/sourcing/job-management/${job.id}`;
    navigate(dest);
  };

  const handleNewJob = () => navigate('/sourcing/job-management/new');

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    await fetchJobs();
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Job"
        highlight="Management"
        subtitle="All open requisitions. Click a Draft row to continue editing, or any other row to view its detail."
      />

      <JobCreation
        jobs={jobs}
        loading={loading}
        onDeleteJob={handleDeleteJob}
        onSelectJob={handleSelectJob}
        onNewJob={handleNewJob}
      />
    </div>
  );
}