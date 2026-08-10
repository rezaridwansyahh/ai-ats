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
import { addApplicantToJob, getCandidatesByApplicantId } from '@/api/candidate.api';

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

/**
 * AddToJobDialog
 * -------------------------------------------------------------------------
 * Now bulk-capable: accepts `applicants` (an array), not a single `applicant`.
 * Callers with just one candidate (the per-row "Add" button) simply pass a
 * one-item array — the dialog has one code path, not two.
 *
 * Because different applicants can already be attached to different jobs,
 * "already added" is computed PER JOB across the whole selection:
 *   - fully added   (every selected applicant already in that job) → disabled
 *   - partially added (some, not all) → still clickable; confirming only
 *     adds the ones not yet in that job
 *   - none added → normal
 *
 * Confirming loops over the applicants that still need adding and fires
 * one addApplicantToJob call each (in parallel), then reports how many
 * succeeded/failed rather than assuming all-or-nothing.
 */
export default function AddToJobDialog({ open, onOpenChange, applicants, onSuccess }) {
  const list = useMemo(() => applicants || [], [applicants]);

  const [jobs, setJobs] = useState([]);
  // Map<applicantId, Set<jobId>> — which jobs each selected applicant is already on.
  const [existingByApplicant, setExistingByApplicant] = useState(new Map());
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sendInvite, setSendInvite] = useState(false);

  useEffect(() => {
    if (!open || list.length === 0) return;
    setSelectedJobId(null);
    setSearch('');
    setError(null);
    setSendInvite(false);

    (async () => {
      setLoadingJobs(true);
      try {
        const [jobsRes, ...existingResults] = await Promise.all([
          getJobs(),
          ...list.map((a) => getCandidatesByApplicantId(a.id)),
        ]);
        const jobList = jobsRes.data.jobs || jobsRes.data || [];
        setJobs(Array.isArray(jobList) ? jobList.filter((j) => j.status === 'Active') : []);

        const map = new Map();
        list.forEach((a, i) => {
          const ids = (existingResults[i]?.data?.pipelines || []).map((p) => p.job_id);
          map.set(a.id, new Set(ids));
        });
        setExistingByApplicant(map);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, list.map((a) => a.id).join(',')]);

  const filteredJobs = useMemo(() => {
    if (!search) return jobs;
    const q = search.toLowerCase();
    return jobs.filter((j) =>
      j.job_title?.toLowerCase().includes(q) ||
      j.job_location?.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  // How many of the selected applicants are already on a given job.
  const alreadyAddedCount = (jobId) =>
    list.reduce((n, a) => n + (existingByApplicant.get(a.id)?.has(jobId) ? 1 : 0), 0);

  const emailCount = list.filter((a) => a.email).length;

  const handleConfirm = async () => {
    if (list.length === 0 || !selectedJobId) return;
    setSubmitting(true);
    setError(null);
    try {
      // Only applicants not already on this job need adding.
      const toAdd = list.filter((a) => !existingByApplicant.get(a.id)?.has(selectedJobId));

      if (toAdd.length === 0) {
        // Everyone selected is already on this job — nothing to do.
        onOpenChange(false);
        return;
      }

      const results = await Promise.allSettled(
        toAdd.map((a) => addApplicantToJob(a.id, selectedJobId))
      );
      const failures = results.filter((r) => r.status === 'rejected');
      const successCount = results.length - failures.length;

      if (failures.length > 0 && successCount === 0) {
        setError(
          failures[0].reason?.response?.data?.message ||
          failures[0].reason?.message ||
          'Failed to add candidates'
        );
        return;
      }

      if (failures.length > 0) {
        // Partial success — still close, but let the caller know via console;
        // a toast system isn't wired up here so we surface via onSuccess count.
        console.warn(`${failures.length} of ${toAdd.length} candidates failed to add.`);
      }

      onSuccess?.(selectedJobId, { added: successCount, failed: failures.length });
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add candidates');
    } finally {
      setSubmitting(false);
    }
  };

  const isBulk = list.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            {isBulk ? `Add ${list.length} Applicants to Job` : 'Add Applicant to Job'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isBulk
              ? 'Choose a job to add these applicants as candidates.'
              : 'Choose a job to add this applicant as a candidate.'}
          </DialogDescription>
        </DialogHeader>

        {/* Applicant summary */}
        {list.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            {isBulk ? (
              <>
                <div className="text-sm font-semibold">{list.length} candidates selected</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {list.slice(0, 4).map((a) => a.name).join(', ')}
                  {list.length > 4 && ` +${list.length - 4} more`}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">{list[0].name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {list[0].last_position || '—'}
                  {list[0].information?.years_experience != null && ` · ${list[0].information.years_experience} yrs`}
                </div>
              </>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          ) : filteredJobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            const addedCount = alreadyAddedCount(job.id);
            const fullyAdded = addedCount === list.length && list.length > 0;
            const partiallyAdded = addedCount > 0 && !fullyAdded;
            return (
              <button
                key={job.id}
                type="button"
                disabled={fullyAdded}
                onClick={() => !fullyAdded && setSelectedJobId(job.id)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  fullyAdded
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
                  {fullyAdded ? (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                      <Check className="h-2.5 w-2.5 mr-0.5" /> Already added
                    </Badge>
                  ) : partiallyAdded ? (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 bg-amber-50 text-amber-600 border-amber-200">
                      {addedCount}/{list.length} already added
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
            disabled={emailCount === 0}
            onCheckedChange={(v) => setSendInvite(!!v)}
          />
          {emailCount === 0 ? (
            <span className="text-muted-foreground italic">
              No email on file — invitation cannot be sent
            </span>
          ) : isBulk ? (
            <span>
              Send invitation email to candidates with an email on file{' '}
              <span className="font-medium">({emailCount} of {list.length})</span>
            </span>
          ) : (
            <span>
              Send invitation email to{' '}
              <span className="font-medium">{list[0].email}</span>
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
            {isBulk ? `Add ${list.length} to Job` : 'Add to Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}















