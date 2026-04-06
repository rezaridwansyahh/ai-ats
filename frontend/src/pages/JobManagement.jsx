import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, FileText, Send, Users, GitBranch, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { getJobs, createJob, updateJob, deleteJob } from '@/api/job.api';
import { getRecruiters } from '@/api/recruiter.api';
import { submitSeekPosting, getSeekJobStatus } from '@/api/job-posting-seek.api';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';
import JobCreation from '@/components/job-management/JobCreation';
import JobStages from '@/components/job-management/JobStages';
import JobPosting from '@/components/job-management/JobPosting';

const STEPS = [
  { key: 'creation', label: 'Job Creation', icon: FileText },
  { key: 'stages', label: 'Job Stages', icon: GitBranch },
  { key: 'posting', label: 'Job Posting', icon: Send },
  { key: 'sourcing', label: 'Job Sourcing', icon: Users },
  { key: 'pipeline', label: 'Applicant Pipeline', icon: Briefcase },
];

// ── Step Placeholder ────────────────────────────────────────────────
function StepPlaceholder({ title, stepNum }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-primary">{stepNum}</span>
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        This step will be available once Job Creation is configured. Content coming soon.
      </p>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────
export default function JobManagementPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [postingSummary, setPostingSummary] = useState(null);
  const [showPostingConfirm, setShowPostingConfirm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      setJobs(res.data.jobs || []);
    } catch (err) {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecruiters = useCallback(async () => {
    try {
      const res = await getRecruiters();
      setRecruiters(res.data.recruiters || []);
    } catch (err) {
      // no-op
    }
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await getJobAccountsByUserId(user.id);
      setAccounts(data.accounts || []);
    } catch {
      // no-op
    }
  }, [user?.id]);

  useEffect(() => {
    fetchJobs();
    fetchRecruiters();
    fetchAccounts();
  }, [fetchJobs, fetchRecruiters, fetchAccounts]);

  const handleCreateJob = async (data) => {
    const res = await createJob(data);
    await fetchJobs();
    return res?.data;
  };

  const handleEditJob = async (id, data) => {
    await updateJob(id, data);
    await fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    await fetchJobs();
  };

  const pollJobStatus = async (queueJobId) => {
    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const { data } = await getSeekJobStatus(queueJobId);
        if (data.state === 'completed') return { success: true };
        if (data.state === 'failed') return { success: false, error: data.failedReason };
      } catch {
        // polling error, keep trying
      }
    }
    return { success: false, error: 'Timed out waiting for job to complete' };
  };

  const handleConfirmPublish = async () => {
    setShowPostingConfirm(false);
    setPublishing(true);
    setPublishError(null);

    const selectedJob = jobs.find(j => j.id === selectedJobId);

    try {
      if (postingSummary?.public?.channels?.includes('Seek')) {
        const seekAccount = accounts.find(a => a.portal_name === 'seek');
        if (seekAccount && selectedJob) {
          const { data } = await submitSeekPosting({
            account_id: seekAccount.id,
            service: 'seek',
            job_id: selectedJob.id,
            dataForm: {
              job_title: selectedJob.job_title,
              job_desc: selectedJob.job_desc || null,
              job_location: selectedJob.job_location || null,
              work_option: selectedJob.work_option || null,
              work_type: selectedJob.work_type || null,
              pay_type: selectedJob.pay_type || null,
              currency: selectedJob.currency || null,
              pay_min: selectedJob.pay_min || null,
              pay_max: selectedJob.pay_max || null,
              pay_display: selectedJob.pay_display || null,
            },
          });

          const queueJobId = data.jobPost?.id;
          if (queueJobId) {
            const result = await pollJobStatus(queueJobId);
            if (!result.success) {
              setPublishError(result.error || 'Seek posting failed');
              setPublishing(false);
              return;
            }
          }
        }
      }

      setPublishing(false);
      setActiveStep(3);
    } catch (err) {
      setPublishError(err.response?.data?.message || err.message || 'Publishing failed');
      setPublishing(false);
    }
  };

  const REQUIRED_FIELDS = [
    { key: 'job_title', label: 'Job Title' },
    { key: 'job_location', label: 'Location' },
    { key: 'work_option', label: 'Work Option' },
    { key: 'work_type', label: 'Work Type' },
    { key: 'company', label: 'Company' },
    { key: 'seniority_level', label: 'Seniority Level' },
    { key: 'company_url', label: 'Company URL' },
    { key: 'job_desc', label: 'Job Description' },
    { key: 'currency', label: 'Currency' },
    { key: 'pay_type', label: 'Pay Type' },
    { key: 'pay_min', label: 'Pay Min' },
    { key: 'pay_max', label: 'Pay Max' },
    { key: 'pay_display', label: 'Pay Display' },
  ];

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedJobId) return;
      const job = jobs.find(j => j.id === selectedJobId);
      if (!job) return;
      const missing = REQUIRED_FIELDS.filter(f => !job[f.key] || (typeof job[f.key] === 'string' && !job[f.key].trim()));
      if (missing.length > 0) {
        setValidationErrors(missing.map(f => f.label));
        return;
      }
    }
    if (activeStep === 2) {
      setShowPostingConfirm(true);
      return;
    }
    setValidationErrors([]);
    setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setValidationErrors([]);
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Job Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            End-to-end job lifecycle — create, configure stages, publish, source, and manage applicants
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 py-3 border-b">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-1 py-1 transition-all ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < activeStep
                  ? 'bg-primary text-white'
                  : i === activeStep
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-bold transition-colors ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-7 h-0.5 mx-1 ${i < activeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] text-muted-foreground italic -mt-4">
        Progress indicator — navigate using the tabs below
      </p>

      {/* Step Navigation */}
      <div className="flex justify-between items-center border-b -mt-2 pb-2">
        {activeStep > 0 ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous: {STEPS[activeStep - 1].label}
          </Button>
        ) : <div />}
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={activeStep === 0 && !selectedJobId }
            onClick={handleNext}
          >
            Next: {STEPS[activeStep + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>

      {/* Validation Error Modal */}
      <Dialog open={validationErrors.length > 0} onOpenChange={() => setValidationErrors([])}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Incomplete Job Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">The following required fields are missing:</p>
            <ul className="list-disc pl-5 space-y-1">
              {validationErrors.map(err => (
                <li key={err} className="text-sm text-red-500">{err}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setValidationErrors([])}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Content */}
      {activeStep === 0 && (
        <JobCreation
          jobs={jobs}
          loading={loading}
          recruiters={recruiters}
          onCreateJob={handleCreateJob}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
      )}
      {activeStep === 1 && (
        <JobStages selectedJob={jobs.find(j => j.id === selectedJobId)} />
      )}
      {activeStep === 2 && (
        <JobPosting
          selectedJob={jobs.find(j => j.id === selectedJobId)}
          onSelectionChange={setPostingSummary}
        />
      )}
      {activeStep === 3 && <StepPlaceholder title="Job Sourcing" stepNum={4} />}
      {activeStep === 4 && <StepPlaceholder title="Applicant Pipeline" stepNum={5} />}

      {/* Posting Confirmation Modal */}
      <Dialog open={showPostingConfirm} onOpenChange={setShowPostingConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Publishing Selection</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">You are about to proceed with the following selection:</p>
            {postingSummary?.public?.enabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Public</p>
                  <p className="text-[11px] text-emerald-700">
                    {postingSummary.public.channels.length > 0
                      ? postingSummary.public.channels.join(', ')
                      : 'No channels published yet'}
                  </p>
                </div>
              </div>
            )}
            {postingSummary?.private?.enabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Private</p>
                  <p className="text-[11px] text-amber-700">
                    {postingSummary.private.channels.length > 0
                      ? postingSummary.private.channels.join(', ')
                      : 'No channels shared yet'}
                  </p>
                </div>
              </div>
            )}
            {postingSummary?.internal?.enabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-primary">Internal Hire Only</p>
                  <p className="text-[11px] text-muted-foreground">
                    Candidates will be sourced from talent pool
                  </p>
                </div>
              </div>
            )}
            {!postingSummary?.public?.enabled && !postingSummary?.private?.enabled && !postingSummary?.internal?.enabled && (
              <div className="px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground text-center">
                No channels or groups selected.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostingConfirm(false)}>Back</Button>
            <Button onClick={handleConfirmPublish}>Confirm &amp; Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publishing overlay */}
      {publishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl px-8 py-6 shadow-lg flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Publishing to channels...</p>
            <p className="text-xs text-muted-foreground">This may take a moment while the RPA processes your job posting.</p>
          </div>
        </div>
      )}

      {/* Publish error banner */}
      {publishError && (
        <Dialog open={!!publishError} onOpenChange={() => setPublishError(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Publishing Failed</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-red-500">{publishError}</p>
            <DialogFooter>
              <Button onClick={() => setPublishError(null)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
