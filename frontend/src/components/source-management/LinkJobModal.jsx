import { useState, useEffect, useMemo } from "react";
import { Briefcase, Search, Loader2, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import { JOB_STATUS_VARIANT } from '@/constants/job-status';
import { getJobs } from '@/api/job.api';
import { linkToJob } from '@/api/job-sourcing.api';
import { toast } from 'sonner';

export default function LinkJobModal({ open, onOpenChange, source, onLinked }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if(!open) return;
    setSearchQuery('');
    setSelectedJobId(null);
    setError(null);

    (async () => {
      setLoading(true);
      try {
        const res = await getJobs();
        setJobs(res.data.jobs || res.data.postings || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filteredJobs = useMemo(() => {
    if(!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(job => job.job_title?.toLowerCase().includes(q));
  }, [jobs, searchQuery]);

  const handleConfirm = async () => {
    if (!selectedJobId || !source?.id) return;
    setLinking(true);
    try {
      await linkToJob(source.id, selectedJobId);
      toast.success(`"${source.job_title}" linked to job`);
      onLinked?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to link job');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            Link Sourcing to Job
          </DialogTitle>
          <DialogDescription>Choose a job to link this sourcing to.</DialogDescription>
        </DialogHeader>
 
        {source && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-sm font-semibold">{source.job_title}</p>
            <p className="text-xs text-muted-foreground capitalize">{source.platform} sourcing</p>
          </div>
        )}
 
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
 
        {error && <p className="text-sm text-red-600">{error}</p>}
 
        <div className="max-h-[280px] overflow-y-auto rounded-lg border divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No jobs found.
            </div>
          ) : filteredJobs.map(job => {
            const alreadyLinked = job.id === source?.job_post_id;
            const isSelected = job.id === selectedJobId;
            return (
              <button
                key={job.id}
                type="button"
                disabled={alreadyLinked}
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors
                  ${alreadyLinked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/40 cursor-pointer'}
                  ${isSelected ? 'bg-emerald-50' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.job_title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[job.job_location, job.work_type].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {alreadyLinked ? (
                  <StatusBadge label="Already linked" variant="success" />
                ) : isSelected ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <StatusBadge
                    label={job.status}
                    variant={JOB_STATUS_VARIANT[job.status] ?? 'muted'}
                  />
                )}
              </button>
            );
          })}
        </div>
 
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedJobId || linking}>
            {linking ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Link to Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}