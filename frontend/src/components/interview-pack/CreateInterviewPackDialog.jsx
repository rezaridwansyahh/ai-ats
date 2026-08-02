import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  AlertTriangle, Check, Copy, Loader2, Search, ChevronRight, ChevronLeft,
} from 'lucide-react';

import { getJobs } from '@/api/job.api';
import { getAll as getAllApplicants } from '@/api/applicant.api';
import { createInterviewPack } from '@/api/interview-pack.api';

const MAX_CANDIDATES = 10;

function StepIndicator({ step }) {
  const steps = ['Job & Info', 'Candidates', 'Review'];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={idx} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border-2 shrink-0 transition-colors ${
              done
                ? 'bg-primary border-primary text-primary-foreground'
                : active
                  ? 'border-primary text-primary bg-background'
                  : 'border-border text-muted-foreground bg-background'
            }`}>
              {done ? <Check className="h-3 w-3" /> : idx}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 ${step > idx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

export function CreateInterviewPackDialog({ open, onOpenChange, onCreated }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [title, setTitle] = useState('Interview Round');
  const [batchCode, setBatchCode] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');

  // Step 2
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [candidateSearch, setCandidateSearch] = useState('');

  // Step 3
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdPack, setCreatedPack] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedJobId('');
      setTitle('Interview Round');
      setBatchCode('');
      setInterviewerName('');
      setWindowStart('');
      setWindowEnd('');
      setApplicants([]);
      setSelectedIds(new Set());
      setCandidateSearch('');
      setError('');
      setCreatedPack(null);
      setCopied(false);
    }
  }, [open]);

  // Load jobs on open
  useEffect(() => {
    if (!open) return;
    setJobsLoading(true);
    getJobs()
      .then((r) => setJobs(r.data?.jobs || r.data || []))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [open]);

  // Load applicants when moving to step 2
  useEffect(() => {
    if (step !== 2) return;
    setApplicantsLoading(true);
    getAllApplicants()
      .then((r) => setApplicants(r.data?.applicants || r.data || []))
      .catch(() => setApplicants([]))
      .finally(() => setApplicantsLoading(false));
  }, [step]);

  const selectedJob = jobs.find((j) => String(j.id ?? j.job_id) === String(selectedJobId));
  const hasRubric = selectedJob?.rubric_snapshot || selectedJob?.has_rubric;

  const filteredApplicants = applicants.filter((a) => {
    const q = candidateSearch.toLowerCase();
    return (
      !q ||
      (a.applicant_name || '').toLowerCase().includes(q) ||
      (a.last_position || '').toLowerCase().includes(q)
    );
  });

  function toggleCandidate(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_CANDIDATES) {
        next.add(id);
      }
      return next;
    });
  }

  function validateStep1() {
    if (!selectedJobId) { setError('Please select a job.'); return false; }
    if (!title.trim()) { setError('Title is required.'); return false; }
    if (!interviewerName.trim()) { setError('Interviewer name is required.'); return false; }
    setError('');
    return true;
  }

  function validateStep2() {
    if (selectedIds.size === 0) { setError('Please select at least one candidate.'); return false; }
    setError('');
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setError('');
    setStep((s) => s + 1);
  }

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        job_id: selectedJobId,
        title: title.trim(),
        batch_code: batchCode.trim() || undefined,
        interviewer_name: interviewerName.trim(),
        window_start: windowStart || undefined,
        window_end: windowEnd || undefined,
        candidates: Array.from(selectedIds).map((applicant_id) => ({ applicant_id })),
      };
      const res = await createInterviewPack(payload);
      setCreatedPack(res.data?.pack || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create interview pack.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyLink() {
    if (!createdPack?.token) return;
    const link = `${window.location.origin}/interview/${createdPack.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDone() {
    onOpenChange(false);
    if (createdPack) onCreated?.();
  }

  const portalLink = createdPack?.token
    ? `${window.location.origin}/interview/${createdPack.token}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Interview Pack</DialogTitle>
          <DialogDescription>
            Set up a shareable scorecard pack for an interviewer.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} />

        {/* Step 1 — Job & Pack Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Job <span className="text-red-500">*</span></Label>
              {jobsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading jobs…
                </div>
              ) : (
                <Select value={selectedJobId} onValueChange={(v) => { setSelectedJobId(v); setError(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job…" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => {
                      const id = String(j.id ?? j.job_id);
                      return (
                        <SelectItem key={id} value={id}>
                          {j.job_title || j.title || `Job #${id}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              {selectedJob && !hasRubric && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  This job has no rubric configured. Please set up AI Screening rubric first.
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ip-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="ip-title"
                placeholder="e.g. Round 2 Interview"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ip-batch">Batch Code</Label>
              <Input
                id="ip-batch"
                placeholder="e.g. R2-A"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ip-interviewer">Interviewer Name <span className="text-red-500">*</span></Label>
              <Input
                id="ip-interviewer"
                placeholder="e.g. Sarah Lee"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ip-start">Window Start</Label>
                <Input
                  id="ip-start"
                  type="date"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ip-end">Window End</Label>
                <Input
                  id="ip-end"
                  type="date"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Candidates */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedIds.size} / {MAX_CANDIDATES} selected</span>
              {selectedIds.size >= MAX_CANDIDATES && (
                <span className="text-amber-600 font-medium">Maximum reached</span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search candidates…"
                className="pl-8 h-8 text-xs"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />
            </div>

            {applicantsLoading ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading candidates…
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
                {filteredApplicants.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No candidates found.</p>
                ) : filteredApplicants.map((a) => {
                  const id = a.applicant_id ?? a.id;
                  const checked = selectedIds.has(id);
                  const disabled = !checked && selectedIds.size >= MAX_CANDIDATES;
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                        checked ? 'bg-primary/5' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/40'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={() => !disabled && toggleCandidate(id)}
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.applicant_name || `Applicant #${id}`}</p>
                        {a.last_position && (
                          <p className="text-xs text-muted-foreground truncate">{a.last_position}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Review & Generate */}
        {step === 3 && !createdPack && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/20 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job</span>
                <span className="font-medium">{selectedJob?.job_title || selectedJob?.title || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title</span>
                <span className="font-medium">{title}</span>
              </div>
              {batchCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch</span>
                  <span className="font-medium">{batchCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interviewer</span>
                <span className="font-medium">{interviewerName}</span>
              </div>
              {(windowStart || windowEnd) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Window</span>
                  <span className="font-medium">{fmtDate(windowStart)} – {fmtDate(windowEnd)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidates</span>
                <span className="font-medium">{selectedIds.size} selected</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Success state */}
        {step === 3 && createdPack && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4" />
              </div>
              Interview pack created successfully!
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Portal link for interviewer</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={portalLink}
                  className="text-xs font-mono bg-muted/20"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {copied && <p className="text-xs text-emerald-600">Copied!</p>}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 3 && createdPack ? (
            <Button onClick={handleDone}>Done</Button>
          ) : (
            <>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => { setStep((s) => s - 1); setError(''); }}
                  disabled={submitting}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              {step < 3 && (
                <Button onClick={handleNext}>
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
              {step === 3 && !createdPack && (
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating…</>
                  ) : 'Generate Pack'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
