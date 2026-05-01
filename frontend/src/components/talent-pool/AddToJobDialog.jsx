import { useState, useEffect, useMemo } from 'react';
import { Loader2, Briefcase, Search, UserPlus, AlertTriangle, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { getJobs } from '@/api/job.api';
import { addApplicantToJob, getCandidatesByApplicantId, sendCandidateEmail } from '@/api/candidate.api';

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function AddToJobDialog({ open, onOpenChange, applicant, onSuccess }) {
  const [jobs, setJobs] = useState([]);
  const [existingJobIds, setExistingJobIds] = useState(new Set());
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sendInvite, setSendInvite] = useState(false);

  useEffect(() => {
    if (!open || !applicant?.id) return;
    setSelectedJobId(null);
    setSearch('');
    setError(null);
    setSendInvite(false);

    (async () => {
      setLoadingJobs(true);
      try {
        const [jobsRes, existingRes] = await Promise.all([
          getJobs(),
          getCandidatesByApplicantId(applicant.id),
        ]);
        const list = jobsRes.data.jobs || jobsRes.data || [];
        setJobs(Array.isArray(list) ? list.filter(j => j.status === 'Active') : []);
        const ids = (existingRes.data.pipelines || []).map(p => p.job_id);
        setExistingJobIds(new Set(ids));
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    })();
  }, [open, applicant?.id]);

  const filteredJobs = useMemo(() => {
    if (!search) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j =>
      j.job_title?.toLowerCase().includes(q) ||
      j.job_location?.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const handleConfirm = async () => {
    if (!applicant?.id || !selectedJobId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await addApplicantToJob(applicant.id, selectedJobId);
      const candidateId = res.data.pipeline?.id;
      if (sendInvite && candidateId) {
        try {
          await sendCandidateEmail(candidateId);
        } catch (mailErr) {
          console.warn('Candidate added but invitation email failed:', mailErr);
        }
      }
      onSuccess?.(selectedJobId);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            Add Applicant to Job
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose a job to add this applicant as a candidate.
          </DialogDescription>
        </DialogHeader>

        {/* Applicant summary */}
        {applicant && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-sm font-semibold">{applicant.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {applicant.last_position || '—'}
              {applicant.information?.years_experience != null && ` · ${applicant.information.years_experience} yrs`}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        {/* Job list */}
        <div className="max-h-[280px] overflow-y-auto border rounded-lg divide-y">
          {loadingJobs ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No jobs found.
            </div>
          ) : filteredJobs.map(job => {
            const isSelected = selectedJobId === job.id;
            const alreadyAdded = existingJobIds.has(job.id);
            return (
              <button
                key={job.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => !alreadyAdded && setSelectedJobId(job.id)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  alreadyAdded
                    ? 'opacity-60 cursor-not-allowed bg-muted/20'
                    : isSelected
                      ? 'bg-primary/5 border-l-2 border-primary hover:bg-primary/5'
                      : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{job.job_title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {job.job_location || 'No location'} · {job.work_type || '—'}
                      </div>
                    </div>
                  </div>
                  {alreadyAdded ? (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                      <Check className="h-2.5 w-2.5 mr-0.5" /> Already added
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${STATUS_COLORS[job.status] || ''}`}>
                      {job.status}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Invitation email opt-in */}
        <label className="flex items-center gap-2 px-1 cursor-pointer text-xs">
          <Checkbox
            id="send-invite"
            checked={sendInvite}
            disabled={!applicant?.email}
            onCheckedChange={(v) => setSendInvite(!!v)}
          />
          {applicant?.email ? (
            <span>
              Send invitation email to{' '}
              <span className="font-medium">{applicant.email}</span>
            </span>
          ) : (
            <span className="text-muted-foreground italic">
              No email on file — invitation cannot be sent
            </span>
          )}
        </label>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-[11px] text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={handleConfirm} disabled={!selectedJobId || submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Add to Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
