import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { getJobs, deleteJob } from '@/api/job.api';
import JobCreation from '@/components/job-management/JobCreation';
import JobWizard from '@/components/job-management/JobWizard';
import AutomationMatrix from '@/components/job-management/AutomationMatrix';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

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

  // TODO: wire to a real export endpoint once available. Currently a stub.
  const handleExport = () => {
    console.warn('Export not yet wired to backend.');
  };

  const stats = useMemo(() => {
    const totalApplicants = jobs.reduce((sum, j) => sum + (j.candidate_count ?? 0), 0);
    const jobsPosted = jobs.length;
    const openJobs = jobs.filter(j => j.status === 'Active' || j.status === 'Running').length;
    const draftJobs = jobs.filter(j => j.status === 'Draft').length;
    return { totalApplicants, jobsPosted, openJobs, draftJobs };
  }, [jobs]);

  return (
    <div className="space-y-8 p-6">
      {/* Strategy wizard + automation matrix — UI-only, no backend yet.
          See TODOs inside JobWizard.jsx / AutomationMatrix.jsx. */}
      <JobWizard />
      <AutomationMatrix />

      {/* Real job list surface */}
      <div className="space-y-6">
        <PageHeader
          title="Job"
          highlight="Management"
          subtitle="All open requisitions. Click a Draft row to continue editing, or any other row to view its detail."
        >
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="rounded-lg" onClick={handleNewJob}>
            <Plus className="h-4 w-4 mr-1.5" /> Create new job
          </Button>
        </PageHeader>

        {/* Stat cards — real numbers only, no fabricated trend data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Applicants" value={stats.totalApplicants} caption="Across all jobs" />
          <StatCard label="Jobs Posted" value={stats.jobsPosted} caption="All statuses" />
          <StatCard label="Open Jobs" value={stats.openJobs} caption="Active or Running" />
          <StatCard label="Draft Jobs" value={stats.draftJobs} caption="Not yet published" />
        </div>

        <JobCreation
          jobs={jobs}
          loading={loading}
          onDeleteJob={handleDeleteJob}
          onSelectJob={handleSelectJob}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, caption }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight mt-1">
        {value.toLocaleString()}
      </div>
      {caption && (
        <div className="text-[11px] text-muted-foreground mt-0.5">{caption}</div>
      )}
    </div>
  );
}