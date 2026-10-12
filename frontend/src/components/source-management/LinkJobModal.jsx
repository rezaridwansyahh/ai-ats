import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Search, Loader2, Check, Lock, X, ArrowLeft, Plus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import { JOB_STATUS_VARIANT } from '@/constants/job-status';
import { getJobs, createJob } from '@/api/job.api';
import { linkToJob, unlinkFromJob, getLinkedJobs } from '@/api/job-sourcing.api';
import { toast } from 'sonner';

const BATTERY_OPTIONS = [
  { value: 'A', label: 'Battery A', hint: 'Big Five · DISC · Holland' },
  { value: 'B', label: 'Battery B', hint: 'TK · PAPI · Holland' },
  { value: 'C', label: 'Battery C', hint: 'TK · PAPI · SJT' },
  { value: 'D', label: 'Battery D', hint: 'TK · MSDT · 16PF · PAPI-L · SJT' },
];

export default function LinkJobModal({ open, onOpenChange, source, onLinked }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [linkedJobs, setLinkedJobs] = useState([]); // [{ job_id, is_origin, ... }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState(new Set());
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState(null);

  const [mode, setMode] = useState('pick'); // 'pick' | 'create'
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({ job_title: '', job_location: '', job_desc: '', assessment_battery: '' });

  const loadLinkedJobs = async () => {
    const res = await getLinkedJobs(source.id);
    setLinkedJobs(res.data.jobs || []);
  };

  useEffect(() => {
    if(!open || !source?.id) return;
    setSearchQuery('');
    setSelectedJobIds(new Set());
    setError(null);
    setMode('pick');
    setNewJob({
      job_title: source.job_title || '',
      job_location: source.job_location || '',
      job_desc: source.job_desc || '',
      assessment_battery: '',
    });

    (async () => {
      setLoading(true);
      try {
        const [jobsRes] = await Promise.all([getJobs(), loadLinkedJobs()]);
        setJobs(jobsRes.data.jobs || jobsRes.data.postings || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, source?.id]);

  const linkedJobIds = useMemo(() => new Set(linkedJobs.map(l => l.job_id)), [linkedJobs]);
  const originJobIds = useMemo(
    () => new Set(linkedJobs.filter(l => l.is_origin).map(l => l.job_id)),
    [linkedJobs]
  );

  const filteredJobs = useMemo(() => {
    if(!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(job => job.job_title?.toLowerCase().includes(q));
  }, [jobs, searchQuery]);

  const toggleSelected = (jobId) => {
    setSelectedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const handleUnlink = async (jobId) => {
    setUnlinkingId(jobId);
    try {
      await unlinkFromJob(source.id, jobId);
      await loadLinkedJobs();
      onLinked?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to unlink job');
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleConfirm = async () => {
    if (selectedJobIds.size === 0 || !source?.id) return;
    setLinking(true);
    try {
      await Promise.all([...selectedJobIds].map(jobId => linkToJob(source.id, jobId)));
      toast.success(`"${source.job_title}" linked to ${selectedJobIds.size} job${selectedJobIds.size > 1 ? 's' : ''}`);
      onLinked?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to link job');
    } finally {
      setLinking(false);
    }
  };

  const handleCreateAndLink = async () => {
    if (!newJob.job_title.trim() || !source?.id) return;
    setCreating(true);
    try {
      const payload = {
        job_title: newJob.job_title.trim(),
        job_location: newJob.job_location.trim() || undefined,
        job_desc: newJob.job_desc.trim() || undefined,
        assessment_battery: newJob.assessment_battery || undefined,
      };
      const res = await createJob(payload);
      const created = res.data.job || res.data;
      await linkToJob(source.id, created.id, true);
      toast.success(`"${created.job_title}" created and linked`);
      onLinked?.();
      onOpenChange(false);
      navigate(`/sourcing/job-management/${created.id}/edit`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            {mode === 'pick' ? 'Link Sourcing to Job' : 'Create New Job'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'pick'
              ? 'Choose one or more jobs to link this sourcing to.'
              : 'A new job will be created from this sourcing and linked automatically.'}
          </DialogDescription>
        </DialogHeader>

        {source && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-sm font-semibold">{source.job_title}</p>
            <p className="text-xs text-muted-foreground capitalize">{source.platform} sourcing</p>
          </div>
        )}

        {mode === 'pick' ? (
          <>
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
                const alreadyLinked = linkedJobIds.has(job.id);
                const isOrigin = originJobIds.has(job.id);
                const isSelected = selectedJobIds.has(job.id);
                const isUnlinking = unlinkingId === job.id;
                return (
                  <div
                    key={job.id}
                    role={alreadyLinked ? undefined : 'button'}
                    tabIndex={alreadyLinked ? undefined : 0}
                    onClick={alreadyLinked ? undefined : () => toggleSelected(job.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors
                      ${alreadyLinked ? '' : 'hover:bg-muted/40 cursor-pointer'}
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
                      isOrigin ? (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" />
                          Origin
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-red-600"
                          disabled={isUnlinking}
                          onClick={(e) => { e.stopPropagation(); handleUnlink(job.id); }}
                        >
                          {isUnlinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><X className="h-3.5 w-3.5 mr-1" />Unlink</>}
                        </Button>
                      )
                    ) : isSelected ? (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <StatusBadge
                        label={job.status}
                        variant={JOB_STATUS_VARIANT[job.status] ?? 'muted'}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create new job instead
            </button>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={selectedJobIds.size === 0 || linking}>
                {linking ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Link to {selectedJobIds.size > 1 ? `${selectedJobIds.size} Jobs` : 'Job'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMode('pick')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to linking an existing job
            </button>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="qc-title">Job Title</Label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--saffron)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--saffron)]">
                    ● From {source?.platform || 'sourcing'} listing
                  </span>
                </div>
                <Input
                  id="qc-title"
                  value={newJob.job_title}
                  onChange={e => setNewJob(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="e.g. Account Manager – Banking & Financial Services"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qc-location">Location</Label>
                <Input
                  id="qc-location"
                  value={newJob.job_location}
                  onChange={e => setNewJob(prev => ({ ...prev, job_location: e.target.value }))}
                  placeholder="e.g. Jakarta Raya"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qc-desc">Description</Label>
                <Textarea
                  id="qc-desc"
                  rows={4}
                  value={newJob.job_desc}
                  onChange={e => setNewJob(prev => ({ ...prev, job_desc: e.target.value }))}
                  placeholder="Role summary, responsibilities..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Assessment Battery</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BATTERY_OPTIONS.map(opt => {
                    const isSelected = newJob.assessment_battery === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewJob(prev => ({ ...prev, assessment_battery: isSelected ? '' : opt.value }))}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors
                          ${isSelected ? 'border-emerald-400 bg-emerald-50' : 'hover:bg-muted/40'}`}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                You'll land on the job editor next to set up the screening rubric.
              </p>
              <Button onClick={handleCreateAndLink} disabled={!newJob.job_title.trim() || creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Create &amp; continue setup
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
