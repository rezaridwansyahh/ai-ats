import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, Pencil, MapPin, Building2, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { formatSinceDate } from '@/lib/job-display';

import { hasPermission } from '@/utils/permissions';

import { StatusBadge } from '@/components/common';
import CandidateDetailModal from '@/components/job-management/CandidateDetailModal';

import OverviewCard from '../components/job-detail/OverviewCard';
import JobDescriptionCard from '../components/job-detail/JobDescriptionCard';
import CandidatesCard from '../components/job-detail/CandidatesCard';
import PostingPanel from '../components/job-detail/PostingPanel';
import PipelinePanel from '../components/job-detail/PipelinePanel';

import { useJobDetail } from '../hooks/use-job-detail';

export default function JobDetailPage() {
  const canEdit = hasPermission('Sourcing', 'Job Management', 'update');
  const navigate = useNavigate();
  const { id } = useParams();
  const [viewCandidate, setViewCandidate] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const {
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
  } = useJobDetail(id);

  // TEMP preview: dummy channels so the Posting card renders before real sync data
  // exists. Flip to false (or delete this block) once postings flow from sync.
  const SHOW_DUMMY_POSTING = true;
  const dummyChannels = SHOW_DUMMY_POSTING ? [
    { id: 'dummy-seek',     platform: 'seek',     job_title: job?.job_title, status: 'Active',  last_sync: new Date(Date.now() - 2 * 3600e3).toISOString() },
    { id: 'dummy-linkedin', platform: 'linkedin', job_title: job?.job_title, status: 'Running', last_sync: new Date(Date.now() - 26 * 3600e3).toISOString() },
  ] : [];
  // Real channels drive Re-sync; dummies are display-only when there are none.
  const displayChannels = channels.length ? channels : dummyChannels;
  const isPosted = displayChannels.length > 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const handleViewCandidate = (candidate) => {
    setViewCandidate(candidate);
    setViewModalOpen(true);
  };

  const candidatesData = { total: candidateTotal, loading: candidatesLoading, list: candidates };
  const candidateFilters = {
    search: candidateSearch, setSearch: setCandidateSearch,
    duration: durationFilter, setDuration: setDurationFilter,
    minScore, setMinScore,
    minSalary: minSalaryInput, setMinSalary: setMinSalaryInput,
    maxSalary: maxSalaryInput, setMaxSalary: setMaxSalaryInput,
    hasActiveSearch: hasActiveCandidateSearch,
    onClear: () => {
      setCandidateSearch('');
      setDurationFilter('');
      setMinScore(0);
      setMinSalaryInput('');
      setMaxSalaryInput('');
    },
  };
  const candidatePagination = { page: candidatePage, setPage: setCandidatePage, totalPages: candidateTotalPages };

  return (
    <>
      {/* Sticky header — lean, mirrors JobEdit's header. Posting + Re-sync live in the aside.
          -mt-5 -mx-5 px-5 cancels <main>'s p-5 so it pins flush under the breadcrumb. */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3">
        {/* Action row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/sourcing/job-management')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Jobs
          </Button>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate(`/sourcing/job-management/${id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          )}
        </div>

        {/* Title + meta */}
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
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {job.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {job.company}</span>}
            {job.job_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.job_location}</span>}
            {job.work_type && <span>{job.work_type}</span>}
            {job.work_option && <span>· {job.work_option}</span>}
            {job.seniority_level && <span>· {job.seniority_level}</span>}
            {job.created_at && <span>· opened {formatSinceDate(job.created_at)}</span>}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
          {/* MAIN COLUMN */}
          <div className="space-y-4 min-w-0">
            <OverviewCard job={job} />
            <JobDescriptionCard job={job} />
            <CandidatesCard
              candidates={candidatesData}
              filters={candidateFilters}
              pagination={candidatePagination}
              onViewCandidate={handleViewCandidate}
            />
          </div>

          {/* ASIDE — sticky posting panel (mirrors JobEdit's aside).
              Offset accounts for the breadcrumb (52px) + the sticky page header. */}
          <aside className="hidden lg:block">
            <div className="sticky top-[207px] space-y-3">
              <PostingPanel
                displayChannels={displayChannels}
                isPosted={isPosted}
                syncing={syncing}
                anySyncing={anySyncing}
                syncableChannels={syncableChannels}
                onResync={handleResync}
              />

              <PipelinePanel
                candidateCount={job.candidate_count}
                onOpenPipeline={() => navigate(`/candidate-pipeline/${id}`)}
              />

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2"
              >
                <ChevronUp className="h-3 w-3" /> Back to top
              </button>
            </div>
          </aside>
        </div>
      </div>

      <CandidateDetailModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        candidate={viewCandidate}
        jobId={id}
      />
    </>
  );
}
