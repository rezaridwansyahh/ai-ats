import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, createJob, updateJob, deleteJob } from '@/api/job.api';
import { getRecruiters } from '@/api/recruiter.api';
import JobCreation from '@/components/job-management/JobCreation';

// Phase 1 of the JobManagement revamp: this page is now just the list surface.
// The 4-step wizard (Creation → Stages → Posting → List Source) is replaced by
// the single-page JobEdit.jsx at /sourcing/job-management/new and :id/edit.
// Active jobs route to JobDetail.jsx at /sourcing/job-management/:id.
export default function JobManagementPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);

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

  const fetchRecruiters = useCallback(async () => {
    try {
      const res = await getRecruiters();
      setRecruiters(res.data.recruiters || []);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchRecruiters();
  }, [fetchJobs, fetchRecruiters]);

  // Row-click behavior: Draft → edit form, anything else → detail page.
  const handleSelectJob = (job) => {
    if (!job) return;
    const dest = job.status === 'Draft'
      ? `/sourcing/job-management/${job.id}/edit`
      : `/sourcing/job-management/${job.id}`;
    navigate(dest);
  };

  // "+ New Job" navigates to /new (no more inline modal).
  const handleNewJob = () => navigate('/sourcing/job-management/new');

  const handleEditJob = async (id, data) => {
    await updateJob(id, data);
    await fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    await fetchJobs();
  };

  // Kept as a stub so JobCreation's old "create from modal" path still works
  // until we fully retire the modal; the new flow uses navigate('/new').
  const handleCreateJob = async (data) => {
    const res = await createJob(data);
    await fetchJobs();
    return res?.data;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All open requisitions. Click a Draft row to continue editing, or any other row to view its detail.
        </p>
      </div>

      <JobCreation
        jobs={jobs}
        loading={loading}
        recruiters={recruiters}
        onCreateJob={handleCreateJob}
        onEditJob={handleEditJob}
        onDeleteJob={handleDeleteJob}
        selectedJob={null}
        onSelectJob={handleSelectJob}
        onNewJob={handleNewJob}
      />
    </div>
  );
}
